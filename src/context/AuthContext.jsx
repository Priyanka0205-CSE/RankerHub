/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  getAdditionalUserInfo
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import axios from "axios";
import { auth, db, signInWithGitHub, signOutUser } from "../lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Listen to Auth State Changed
  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous snapshot listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        setUser(currentUser);
        
        // Listen in real-time to the user document in Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            setIsOnboarding(data.onboardingStatus === "incomplete");
            setLoading(false);
          } else {
            // Skeletal document doesn't exist yet, meaning onboarding is pending
            setUserData(null);
            setIsOnboarding(true);
            setLoading(false);
          }
        }, (error) => {
          console.error("Real-time profile listener error:", error);
          setLoading(false);
        });

      } else {
        setUser(null);
        setUserData(null);
        setIsOnboarding(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Securely login with GitHub and immediately provision skeletal incomplete user if not exists
  const login = async () => {
    // Set loading true so route guards show loading screen during the popup flow.
    // IMPORTANT: We do NOT set loading=false on success — the onSnapshot listener
    // in useEffect is the sole source of truth for resolving loading+isOnboarding.
    // This prevents a race condition where setLoading(false) in finally{}
    // would resolve before onSnapshot detects the new skeletal document,
    // causing ProtectedRoute to see (loading=false, isOnboarding=false) and
    // incorrectly allow through to dashboard.
    setLoading(true);
    try {
      const result = await signInWithGitHub();
      const authUser = result.user;
      const accessToken = result.accessToken;

      // Extract GitHub details securely using getAdditionalUserInfo
      const additionalInfo = getAdditionalUserInfo(result);
      const githubUsername = additionalInfo?.username || authUser.displayName || "";
      const githubId = additionalInfo?.profile?.id || null;
      const avatar = additionalInfo?.profile?.avatar_url || authUser.photoURL || "";

      // Store GitHub accessToken in sessionStorage securely (non-persistent across tabs for security)
      sessionStorage.setItem(`gh_token_${authUser.uid}`, accessToken);

      const userDocRef = doc(db, "users", authUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {

        
        // Provision skeletal record with "incomplete" status so onboarding lock is active
        const skeletalUser = {
          uid: authUser.uid,
          githubUsername,
          githubId,
          name: authUser.displayName || githubUsername || "Developer",
          email: authUser.email || "",
          avatar,
          onboardingStatus: "incomplete",
          city: "",
          streak: 0,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          points: {
            gitRankPoints: 0, // calculated from actual repos/followers/stars on submission
            codingVersePoints: 0,
            streakPoints: 0,
            referralPoints: 0,
            totalPoints: 0
          }
        };

        // Save initial skeletal document securely
        // Once this write completes, the onSnapshot listener in useEffect will
        // fire and set isOnboarding=true + loading=false
        await setDoc(userDocRef, skeletalUser);
      } else {
        // If user already exists, update their lastLogin timestamp securely
        await setDoc(userDocRef, {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }

      return authUser;
    } catch (error) {
      console.error("Login service failure:", error);
      setLoading(false); // Only set loading false on error so UI can show the error
      throw error;
    }
  };

  // Logout utility
  const logout = async () => {
    setLoading(true);
    try {
      if (user) {
        sessionStorage.removeItem(`gh_token_${user.uid}`);
      }
      await signOutUser();
      setUser(null);
      setUserData(null);
      setIsOnboarding(false);
    } catch (error) {
      console.error("Logout failure:", error);
    } finally {
      setLoading(false);
    }
  };

  // Securely fetches GitHub stats on the client once using the transient OAuth token
  const fetchGitHubStats = async (uid, username) => {
    const token = sessionStorage.getItem(`gh_token_${uid}`);
    const headers = token ? { Authorization: `token ${token}` } : {};

    try {
      // 1. Fetch authenticated user profile data
      const profileRes = await axios.get(`https://api.github.com/users/${username}`, { headers });
      const publicRepos = profileRes.data.public_repos || 0;
      const followers = profileRes.data.followers || 0;
      
      // 2. Fetch repos to sum up stargazers and calculate primary language
      let stars = 0;
      let primaryLanguage = "JavaScript";
      try {
        const reposRes = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&type=owner`, { headers });
        stars = reposRes.data.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
        
        // Count language frequency
        const langCounts = {};
        reposRes.data.forEach(r => {
          if (r.language) {
            langCounts[r.language] = (langCounts[r.language] || 0) + 1;
          }
        });
        const sortedLangs = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a]);
        if (sortedLangs.length > 0) {
          primaryLanguage = sortedLangs[0];
        }
      } catch (err) {
        console.warn("Stars/Language retrieval warning, defaulting:", err);
      }

      // 3. Fetch total commits using Search API (authenticated allows up to 30 requests/min securely)
      let commits = 0;
      try {
        const commitsRes = await axios.get(`https://api.github.com/search/commits?q=author:${username}`, { headers });
        commits = commitsRes.data.total_count || 0;
      } catch (err) {
        console.warn("Commits retrieval failed; score will be incomplete until next refresh:", err);
        commits = 0;
      }

      // 4. Fetch total pull requests
      let prs = 0;
      try {
        const prsRes = await axios.get(`https://api.github.com/search/issues?q=author:${username}+type:pr`, { headers });
        prs = prsRes.data.total_count || 0;
      } catch (err) {
        console.warn("PRs retrieval failed; score will be incomplete until next refresh:", err);
        prs = 0;
      }

      // 5. Fetch total reviews (PRs reviewed by user)
      let reviews = 0;
      try {
        const reviewsRes = await axios.get(`https://api.github.com/search/issues?q=reviewed-by:${username}`, { headers });
        reviews = reviewsRes.data.total_count || 0;
      } catch (err) {
        console.warn("Reviews retrieval failed; score will be incomplete until next refresh:", err);
        reviews = 0;
      }

      // Calculate initial GitRank points securely based on real work only:
      // Commits -> +2, PRs -> +5, Reviews -> +10
      const gitRankPoints = (commits * 2) + (prs * 5) + (reviews * 10);

      return {
        commits,
        prs,
        reviews,
        publicRepos,
        stars,
        followers,
        primaryLanguage,
        gitRankPoints
      };
    } catch (error) {
      console.error("Error executing GitHub stats fetcher snapshot:", error);
      // Return honest zeros when the API is unreachable so no fabricated
      // points are written to Firestore. The caller can surface a
      // "score pending" state and re-fetch on the next login.
      return {
        commits: 0,
        prs: 0,
        reviews: 0,
        publicRepos: 0,
        stars: 0,
        followers: 0,
        primaryLanguage: "JavaScript",
        gitRankPoints: 0
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isOnboarding, login, logout, fetchGitHubStats }}>
      {children}
    </AuthContext.Provider>
  );
};
