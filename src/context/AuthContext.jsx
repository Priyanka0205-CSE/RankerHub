/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  getAdditionalUserInfo,
  getRedirectResult,
  GithubAuthProvider
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import axios from "axios";
import { auth, db, signInWithGitHub, signOutUser } from "../lib/firebase";
import { validateUserData } from "../utils/inputValidation";
import { userDataCache, listenerOptimizer } from "../utils/firestoreOptimization";
import { calculateTrustScore } from "../services/trustScoreService";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const checkAndUpdateStreak = async (data, docRef) => {
  if (!data || data.onboardingStatus !== "complete") return;
  const now = new Date();
  const lastLoginDate = data.lastLogin ? new Date(data.lastLogin) : null;

  //  GUARD 1 (Client-side): 
  if (lastLoginDate && lastLoginDate.toDateString() === now.toDateString()) {
    return;
  }

  try {
    await runTransaction(db, async (transaction) => {
      //  Read absolute latest data from server
      const userDoc = await transaction.get(docRef);
      if (!userDoc.exists()) return;

      const latestData = userDoc.data();
      const currentNow = new Date();
      const latestLastLogin = latestData.lastLogin ? new Date(latestData.lastLogin) : null;

      //  GUARD 2 (Server-side Atomic Check):
      if (latestLastLogin && latestLastLogin.toDateString() === currentNow.toDateString()) {
        return;
      }

      let newStreak = latestData.streak || 1;
      let newStreakPoints = latestData.points?.streakPoints || 0;

      if (latestLastLogin) {
        const yesterday = new Date(currentNow);
        yesterday.setDate(yesterday.getDate() - 1);

        const lastLoginDateStr = latestLastLogin.toDateString();
        const yesterdayStr = yesterday.toDateString();

        if (lastLoginDateStr === yesterdayStr) {
          newStreak += 1;
          newStreakPoints += 10;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newTotalPoints = (latestData.points?.gitRankPoints || 0) + 
                             (latestData.points?.referralPoints || 0) + 
                             (latestData.points?.codingVersePoints || 0) + 
                             newStreakPoints;
                             
      const newLongestStreak = Math.max(latestData.longestStreak || 0, newStreak);

      // 📝 Write atomic update
      transaction.update(docRef, {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastLogin: currentNow.toISOString(),
        "points.streakPoints": newStreakPoints,
        "points.totalPoints": newTotalPoints,
        hubCoins: (latestData.hubCoins || 0) + 10
      });
    });
  } catch (err) {
    console.error("Failed to update streak atomically:", err);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(auth ? true : false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  // GitHub OAuth access token stored only in memory, not persisted to storage
  // Firebase Auth handles session persistence securely via HTTP-only cookies
  const [ghAccessToken, setGhAccessToken] = useState(null);

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase auth is not initialized; auth listener skipped.");
      return undefined;
    }

    let unsubscribeSnapshot = null;

    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const authUser = result.user;
          const credential = GithubAuthProvider.credentialFromResult(result);
          const accessToken = credential?.accessToken || null;
          if (accessToken) {
            setGhAccessToken(accessToken);
            sessionStorage.setItem(`gh_token_${authUser.uid}`, accessToken);
          }

          const additionalInfo = getAdditionalUserInfo(result);
          const githubUsername = (additionalInfo?.username || authUser.displayName || "").trim();
          const githubId = additionalInfo?.profile?.id || null;
          const avatar = additionalInfo?.profile?.avatar_url || authUser.photoURL || "";

          const userDocRef = doc(db, "users", authUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            const skeletalUser = {
              uid: authUser.uid,
              githubUsername,
              githubId,
              name: authUser.displayName || githubUsername || "Developer",
              email: authUser.email || "",
              avatar,
              onboardingStatus: "incomplete",
              privateRepoSyncEnabled: true,
              city: "",
              streak: 0,
              longestStreak: 0,
              githubStreak: 0,
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              points: {
                gitRankPoints: 0,
                codingVersePoints: 0,
                streakPoints: 0,
                referralPoints: 0,
                auditorPoints: 0,
                trustScore: 50,
                totalPoints: 0
              },
              lastAuditReward: null
            };
            await setDoc(userDocRef, skeletalUser);
          } else {
            await setDoc(userDocRef, {
              lastLogin: new Date().toISOString(),
            }, { merge: true });
          }
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in resolution failure:", error);
      });

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        setUser(currentUser);

        const userDocRef = doc(db, "users", currentUser.uid);
        
        const docPath = `users/${currentUser.uid}`;
        const cachedData = userDataCache.get(docPath);
        if (cachedData) {
          setUserData(cachedData);
          setIsOnboarding(cachedData.onboardingStatus === "incomplete");
          setLoading(false);
        }

        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            userDataCache.set(docPath, data);

            listenerOptimizer.debounce(currentUser.uid, (userData) => {
              setUserData(userData);
              setIsOnboarding(userData.onboardingStatus === "incomplete");
              setLoading(false);
            }, data);

            checkAndUpdateStreak(data, userDocRef);
          } else {
            userDataCache.delete(docPath);
            listenerOptimizer.debounce(currentUser.uid, () => {
              setUserData(null);
              setIsOnboarding(true);
              setLoading(false);
            }, null);
          }
        }, (_error) => {
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

  const login = async (requestRepoScope = true) => {
    try {
      const response = await signInWithGitHub(requestRepoScope);
      setLoading(true);
      if (!response) {
        return null;
      }
      const { user: authUser, accessToken, result } = response;

      const additionalInfo = getAdditionalUserInfo(result);
      const rawUserData = {
        githubUsername: additionalInfo?.username || authUser.displayName || "",
        name: authUser.displayName || additionalInfo?.username || "Developer",
        email: authUser.email || "",
        avatar: additionalInfo?.profile?.avatar_url || authUser.photoURL || ""
      };

      const validation = validateUserData(rawUserData);
      if (!validation.isValid) {
        console.warn("User data validation warnings:", validation.errors);
      }

      const sanitizedUserData = validation.sanitized;
      const githubId = additionalInfo?.profile?.id || null;

      setGhAccessToken(accessToken);
      sessionStorage.setItem(`gh_token_${authUser.uid}`, accessToken);

      const userDocRef = doc(db, "users", authUser.uid);
      const docSnap = await getDoc(userDocRef);

      const today = new Date();

      if (!docSnap.exists()) {
        // First login ever — initialize user document with base streak
        const skeletalUser = {
          uid: authUser.uid,
          githubUsername: sanitizedUserData.githubUsername,
          githubId,
          name: sanitizedUserData.name,
          email: sanitizedUserData.email,
          avatar: sanitizedUserData.avatar,
          onboardingStatus: "incomplete",
          privateRepoSyncEnabled: requestRepoScope,
          city: "",
          streak: 1,
          longestStreak: 0,
          githubStreak: 0,
          lastLogin: today.toISOString(),
          createdAt: today.toISOString(),
          points: {
            gitRankPoints: 0,
            codingVersePoints: 0,
            streakPoints: 10,
            referralPoints: 0,
            auditorPoints: 0,
            trustScore: 50,
            totalPoints: 10
          },
          hubCoins: 500,
          inventory: ["oliver"],
          activeMascot: "oliver",
          lastAuditReward: null
        };
        await setDoc(userDocRef, skeletalUser);
      } else {
        // Existing user: only update lastLogin and repo scope here.
        // Streak calculation is handled exclusively by checkAndUpdateStreak()
        // via an atomic runTransaction triggered by the onSnapshot listener.
        // Duplicating streak logic here caused double streak points on login day.
        await setDoc(userDocRef, {
          lastLogin: today.toISOString(),
          ...(requestRepoScope && { privateRepoSyncEnabled: true })
        }, { merge: true });
      }

      return authUser;
    } catch (error) {
      console.error("Login service failure:", error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      if (user?.uid) {
        sessionStorage.removeItem(`gh_token_${user.uid}`);
      }
      setUser(null);
      setUserData(null);
      setIsOnboarding(false);
      setGhAccessToken(null);
    } catch (error) {
      console.error("Logout failure:", error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseMascot = async (mascotId, price) => {
    if (!user || !userData) throw new Error("Not authenticated");

    try {
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction) => {
        // Read live Firestore data inside the transaction to prevent stale
        // client-side state from being used as the source of truth.
        // This guards against concurrent purchases from multiple tabs or
        // devices spending the same hubCoins balance simultaneously.
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document not found");

        const liveData = userDoc.data();
        const liveCoins = liveData.hubCoins ?? 0;
        const liveInventory = liveData.inventory || ["oliver"];

        if (liveCoins < price) {
          throw new Error("Insufficient HubCoins");
        }

        if (liveInventory.includes(mascotId)) {
          throw new Error("Mascot already owned");
        }

        transaction.update(userRef, {
          hubCoins: liveCoins - price,
          inventory: [...liveInventory, mascotId],
          updatedAt: new Date().toISOString()
        });
      });

      console.log(`Purchased mascot ${mascotId}`);
    } catch (err) {
      console.error("Failed to purchase mascot:", err);
      throw err;
    }
  };

  const equipMascot = async (mascotId) => {
    if (!user || !userData) throw new Error("Not authenticated");
    const currentInventory = userData.inventory || ["oliver"];
    if (!currentInventory.includes(mascotId)) {
      throw new Error("Mascot not owned");
    }
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        activeMascot: mascotId,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to equip mascot:", err);
      throw err;
    }
  };

  const fetchGitHubStats = async (uid, username) => {
    if (!username || typeof username !== "string") {
      throw new Error("GitHub username is required and must be a string.");
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0 || trimmedUsername.length > 39) {
      throw new Error("GitHub username must be between 1 and 39 characters.");
    }

    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmedUsername)) {
      throw new Error("GitHub username can only contain letters, digits, and hyphens, and cannot start or end with a hyphen.");
    }

    const encodedUsername = encodeURIComponent(trimmedUsername);
    const token = ghAccessToken;
    const headers = token ? { Authorization: `token ${token}` } : {};

    try {
      const profileRes = await axios.get(`https://api.github.com/users/${encodedUsername}`, { headers });
      const publicRepos = profileRes.data.public_repos || 0;
      const followers = profileRes.data.followers || 0;
      
      let stars = 0;
      let primaryLanguage = "JavaScript";
      let reposList = [];
      try {
        const reposRes = await axios.get(`https://api.github.com/users/${encodedUsername}/repos?per_page=100&type=owner`, { headers });
        reposList = reposRes.data || [];
        stars = reposList.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
        
        const langCounts = {};
        reposList.forEach(r => {
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

      let commits = 0;
      try {
        const commitsRes = await axios.get(`https://api.github.com/search/commits?q=author:${encodedUsername}`, { headers });
        commits = commitsRes.data.total_count || 0;
      } catch (err) {
        console.warn("Commits retrieval failed; score will be incomplete until next refresh:", err);
        commits = 0;
      }

      let prs = 0;
      try {
        const prsRes = await axios.get(`https://api.github.com/search/issues?q=author:${encodedUsername}+type:pr`, { headers });
        prs = prsRes.data.total_count || 0;
      } catch (err) {
        console.warn("PRs retrieval failed; score will be incomplete until next refresh:", err);
        prs = 0;
      }

      let mergedPrsCount = 0;
      try {
        const mergedPrsRes = await axios.get(`https://api.github.com/search/issues?q=author:${encodedUsername}+type:pr+is:merged`, { headers });
        mergedPrsCount = mergedPrsRes.data.total_count || 0;
      } catch (err) {
        console.warn("Merged PRs retrieval failed; score will be incomplete until next refresh:", err);
        mergedPrsCount = 0;
      }

      let reviews = 0;
      try {
        const reviewsRes = await axios.get(`https://api.github.com/search/issues?q=reviewed-by:${encodedUsername}`, { headers });
        reviews = reviewsRes.data.total_count || 0;
      } catch (err) {
        console.warn("Reviews retrieval failed; score will be incomplete until next refresh:", err);
        reviews = 0;
      }

      let githubStreak = 0;
      let eventsList = [];
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const eventDates = new Set();
        let eventsUrl = `https://api.github.com/users/${username}/events?per_page=100`;
        let firstPageLoaded = false;

        while (eventsUrl) {
          let events = [];
          if (!firstPageLoaded) {
            const eventsRes = await axios.get(eventsUrl, { headers });
            events = eventsRes.data || [];
            eventsList = events;
            firstPageLoaded = true;
            const linkHeader = eventsRes.headers?.link || eventsRes.headers?.Link;
            eventsUrl = linkHeader ? (linkHeader.match(/<([^>]+)>;\s*rel="next"/) ? linkHeader.match(/<([^>]+)>;\s*rel="next"/)[1] : null) : null;
          } else {
            const eventsRes = await axios.get(eventsUrl, { headers });
            events = eventsRes.data || [];
            const linkHeader = eventsRes.headers?.link || eventsRes.headers?.Link;
            eventsUrl = linkHeader ? (linkHeader.match(/<([^>]+)>;\s*rel="next"/) ? linkHeader.match(/<([^>]+)>;\s*rel="next"/)[1] : null) : null;
          }
          
          if (!events || events.length === 0) {
            break;
          }

          let oldestEventDateStr = null;

          events.forEach(e => {
            if (e.created_at) {
              const dateStr = e.created_at.split('T')[0];
              eventDates.add(dateStr);
              oldestEventDateStr = dateStr;
            }
          });

          if (oldestEventDateStr && oldestEventDateStr < yesterdayStr) {
            break;
          }
        }

        let dateToCheck = new Date(today);
        
        if (eventDates.has(todayStr)) {
          // Streak is active today
        } else if (eventDates.has(yesterdayStr)) {
          dateToCheck = yesterday;
        } else {
          dateToCheck = null;
        }

        if (dateToCheck) {
          while (true) {
            const checkStr = dateToCheck.toISOString().split('T')[0];
            if (eventDates.has(checkStr)) {
              githubStreak++;
              dateToCheck.setDate(dateToCheck.getDate() - 1);
            } else {
              break;
            }
          }
        }
      } catch (err) {
        console.warn("GitHub events retrieval failed for streak:", err);
      }

      const gitRankPoints = (commits * 2) + (prs * 5) + (reviews * 10) + (githubStreak * 10);
      
      let trustScore = 50;
      try {
        const trustBreakdown = calculateTrustScore(
          trimmedUsername,
          { commits, prs, reviews, publicRepos, stars, followers },
          eventsList,
          reposList,
          mergedPrsCount
        );
        trustScore = trustBreakdown.totalScore;
      } catch (err) {
        console.warn("Trust score calculation error:", err);
      }

      return {
        commits,
        prs,
        reviews,
        publicRepos,
        stars,
        followers,
        primaryLanguage,
        githubStreak,
        gitRankPoints,
        trustScore
      };
    } catch (error) {
      console.error("Error executing GitHub stats fetcher snapshot:", error);
      return {
        commits: 0,
        prs: 0,
        reviews: 0,
        publicRepos: 0,
        stars: 0,
        followers: 0,
        primaryLanguage: "JavaScript",
        githubStreak: 0,
        gitRankPoints: 0
      };
    }
  };

  const syncGitHubData = async () => {
    if (!user || !userData?.githubUsername) return;

    if (userData.lastSync) {
      const getTimestamp = (val) => {
        if (!val) return 0;
        if (val.toMillis) return val.toMillis();
        if (val.seconds) return val.seconds * 1000;
        return new Date(val).getTime();
      };
      const lastSyncTime = getTimestamp(userData.lastSync);
      const cooldownMs = 5 * 60 * 1000;
      if (Date.now() - lastSyncTime < cooldownMs) {
        return;
      }
    }

    try {
      const ghStats = await fetchGitHubStats(user.uid, userData.githubUsername);
      const userRef = doc(db, "users", user.uid);

      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error("User document does not exist in Firestore!");
      }

      const liveData = userDoc.data();
      const currentReferralPoints = liveData.points?.referralPoints || 0;
      const currentCodingVersePoints = liveData.points?.codingVersePoints || 0;
      const currentStreakPoints = liveData.points?.streakPoints || 0;

      const newGitRankPoints = ghStats.gitRankPoints;
      const newTotalPoints = newGitRankPoints + currentReferralPoints + currentCodingVersePoints + currentStreakPoints;

      const batch = writeBatch(db);
      
      batch.update(userRef, {
        "githubStats.commits": ghStats.commits,
        "githubStats.prs": ghStats.prs,
        "githubStats.reviews": ghStats.reviews,
        "githubStats.repos": ghStats.publicRepos,
        "githubStats.stars": ghStats.stars,
        "githubStats.followers": ghStats.followers,
        "githubStats.primaryLanguage": ghStats.primaryLanguage,
        "githubStreak": ghStats.githubStreak,
        "points.gitRankPoints": newGitRankPoints,
        "points.totalPoints": newTotalPoints,
        "points.trustScore": ghStats.trustScore,
        "lastSync": serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      console.error("Background GitHub sync failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isOnboarding, login, logout, fetchGitHubStats, syncGitHubData, ghAccessToken, setUserData, purchaseMascot, equipMascot }}>
      {children}
    </AuthContext.Provider>
  );
};
