/* eslint-disable react-refresh/only-export-components */
import { githubFetch, getRateLimitMessage } from "../utils/githubRateLimit";
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
import {
  calculateGithubStreak,
  detectTimezone,
  resolveTimezone,
  toLocalDateString,
  addDaysToDateString,
  evaluateLoginStreak,
} from "../utils/streakCalculator";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const checkAndUpdateStreak = async (data, docRef) => {
  if (!data || data.onboardingStatus !== "complete") return;
  const now = new Date();
  const timeZone = resolveTimezone(data.timezone);
  const lastLoginDate = data.lastLogin ? new Date(data.lastLogin) : null;

  if (
    lastLoginDate &&
    toLocalDateString(lastLoginDate, timeZone) === toLocalDateString(now, timeZone)
  ) {
    return;
  }

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(docRef);
      if (!userDoc.exists()) return;

      const latestData = userDoc.data();
      const currentNow = new Date();
      const latestTimeZone = resolveTimezone(latestData.timezone);
      const latestLastLogin = latestData.lastLogin ? new Date(latestData.lastLogin) : null;

      if (
        latestLastLogin &&
        toLocalDateString(latestLastLogin, latestTimeZone) ===
          toLocalDateString(currentNow, latestTimeZone)
      ) {
        return;
      }

      const streakUpdate = evaluateLoginStreak(
        latestLastLogin?.toISOString() ?? null,
        currentNow.toISOString(),
        latestData.streak || 1,
        latestTimeZone
      );

      const newStreak = streakUpdate.streak;
      let newStreakPoints = latestData.points?.streakPoints || 0;
      if (
        streakUpdate.updated &&
        latestLastLogin &&
        newStreak === (latestData.streak || 1) + 1
      ) {
        newStreakPoints += 10;
      }

      const newTotalPoints =
        (latestData.points?.gitRankPoints || 0) +
        (latestData.points?.referralPoints || 0) +
        (latestData.points?.codingVersePoints || 0) +
        newStreakPoints;

      const newLongestStreak = Math.max(latestData.longestStreak || 0, newStreak);

      transaction.update(docRef, {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastLogin: currentNow.toISOString(),
        timezone: latestTimeZone,
        "points.streakPoints": newStreakPoints,
        "points.totalPoints": newTotalPoints,
        hubCoins: (data.hubCoins || 0) + 10
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
              timezone: detectTimezone(),
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
            await setDoc(
              userDocRef,
              { lastLogin: new Date().toISOString(), timezone: detectTimezone() },
              { merge: true }
            );
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
        // Confirm the restored token actually belongs to this user
        const storedToken = sessionStorage.getItem(`gh_token_${currentUser.uid}`);
        if (storedToken) {
          setGhAccessToken(storedToken);  // always restore for the correct user
        }
        const userDocRef = doc(db, "users", currentUser.uid);

        const docPath = `users/${currentUser.uid}`;
        const cachedData = userDataCache.get(docPath);
        if (cachedData) {
          setUserData(cachedData);
          setIsOnboarding(cachedData.onboardingStatus === "incomplete");
          setLoading(false);
        }

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();

              userDataCache.set(docPath, data);

              listenerOptimizer.debounce(
                currentUser.uid,
                (userData) => {
                  setUserData(userData);
                  setIsOnboarding(userData.onboardingStatus === "incomplete");
                  setLoading(false);
                },
                data
              );

              checkAndUpdateStreak(data, userDocRef);
            } else {
              userDataCache.delete(docPath);
              listenerOptimizer.debounce(
                currentUser.uid,
                () => {
                  setUserData(null);
                  setIsOnboarding(true);
                  setLoading(false);
                },
                null
              );
            }
          },
          (_error) => {
            setLoading(false);
          }
        );
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
      if (!response) return null;

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
        await setDoc(
          userDocRef,
          {
            lastLogin: today.toISOString(),
            ...(requestRepoScope && { privateRepoSyncEnabled: true })
          },
          { merge: true }
        );
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
      Object.keys(sessionStorage)
        .filter(k => k.startsWith("gh_token_"))
        .forEach(k => sessionStorage.removeItem(k));
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
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User document not found");

        const liveData = userDoc.data();
        const liveCoins = liveData.hubCoins ?? 0;
        const liveInventory = liveData.inventory || ["oliver"];

        if (liveCoins < price) throw new Error("Insufficient HubCoins");
        if (liveInventory.includes(mascotId)) throw new Error("Mascot already owned");

        transaction.update(userRef, {
          hubCoins: liveCoins - price,
          inventory: [...liveInventory, mascotId],
          updatedAt: new Date().toISOString()
        });
      });
    } catch (err) {
      console.error("Failed to purchase mascot:", err);
      throw err;
    }
  };

  const equipMascot = async (mascotId) => {
    if (!user || !userData) throw new Error("Not authenticated");
    const currentInventory = userData.inventory || ["oliver"];
    if (!currentInventory.includes(mascotId)) throw new Error("Mascot not owned");

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

  const fetchGitHubStats = async (uid, username, timeZone) => {
    if (!username || typeof username !== "string") {
      throw new Error("GitHub username is required and must be a string.");
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0 || trimmedUsername.length > 39) {
      throw new Error("GitHub username must be between 1 and 39 characters.");
    }

    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmedUsername)) {
      throw new Error(
        "GitHub username can only contain letters, digits, and hyphens, and cannot start or end with a hyphen."
      );
    }

    const encodedUsername = encodeURIComponent(trimmedUsername);
    const token = ghAccessToken;
    const headers = token ? { Authorization: `token ${token}` } : {};

    try {
      const { data: profileData, rateLimitError: profileRateLimit } = await githubFetch(() =>
        axios.get(`https://api.github.com/users/${encodedUsername}`, { headers })
      );
      if (profileRateLimit) {
        throw new Error(profileRateLimit);
      }
      const publicRepos = profileData.public_repos || 0;
      const followers = profileData.followers || 0;

      let stars = 0;
      let primaryLanguage = "JavaScript";
      let reposList = [];
      try {
        const { data: reposData, rateLimitError: reposRateLimit } = await githubFetch(() =>
          axios.get(
            `https://api.github.com/users/${encodedUsername}/repos?per_page=100&type=owner`,
            { headers }
          )
        );
        if (!reposRateLimit && reposData) {
          reposList = reposData;
          stars = reposData.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
          const langCounts = {};
          reposData.forEach((r) => {
            if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
          });
          const sortedLangs = Object.keys(langCounts).sort(
            (a, b) => langCounts[b] - langCounts[a]
          );
          if (sortedLangs.length > 0) primaryLanguage = sortedLangs[0];
        }
      } catch (err) {
        console.warn("Stars/Language retrieval warning, defaulting:", err);
      }

      let commits = 0;
      try {
        const { data: commitsData, rateLimitError: commitsRateLimit } = await githubFetch(() =>
          axios.get(
            `https://api.github.com/search/commits?q=author:${encodedUsername}`,
            { headers }
          )
        );
        if (commitsRateLimit) console.warn(commitsRateLimit);
        else commits = commitsData?.total_count || 0;
      } catch (err) {
        console.warn("Commits retrieval failed:", err);
      }

      let prs = 0;
      try {
        const { data: prsData, rateLimitError: prsRateLimit } = await githubFetch(() =>
          axios.get(
            `https://api.github.com/search/issues?q=author:${encodedUsername}+type:pr`,
            { headers }
          )
        );
        if (prsRateLimit) console.warn(prsRateLimit);
        else prs = prsData?.total_count || 0;
      } catch (err) {
        console.warn("PRs retrieval failed:", err);
      }

      let mergedPrsCount = 0;
      try {
        const mergedPrsRes = await axios.get(
          `https://api.github.com/search/issues?q=author:${encodedUsername}+type:pr+is:merged`,
          { headers }
        );
        mergedPrsCount = mergedPrsRes.data.total_count || 0;
      } catch (err) {
        console.warn(
          "Merged PRs retrieval failed; score will be incomplete until next refresh:",
          err
        );
        mergedPrsCount = 0;
      }

      let reviews = 0;
      try {
        const { data: reviewsData, rateLimitError: reviewsRateLimit } = await githubFetch(() =>
          axios.get(
            `https://api.github.com/search/issues?q=reviewed-by:${encodedUsername}`,
            { headers }
          )
        );
        if (reviewsRateLimit) console.warn(reviewsRateLimit);
        else reviews = reviewsData?.total_count || 0;
      } catch (err) {
        console.warn("Reviews retrieval failed:", err);
      }

      // --- Streak calculation (user-local calendar days) ---
      let githubStreak = 0;
      let eventsList = [];
      const streakTimeZone = resolveTimezone(timeZone);

      try {
        const todayStr = toLocalDateString(new Date(), streakTimeZone);
        const yesterdayStr = addDaysToDateString(todayStr, -1);
        const eventTimestamps = [];

        let eventsUrl = `https://api.github.com/users/${encodedUsername}/events?per_page=100`;
        let firstPageLoaded = false;

        while (eventsUrl) {
          const eventsRes = await axios.get(eventsUrl, { headers });
          const events = eventsRes.data || [];

          if (!firstPageLoaded) {
            eventsList = events;
            firstPageLoaded = true;
          }

          const linkHeader = eventsRes.headers?.link || eventsRes.headers?.Link;
          eventsUrl = linkHeader?.match(/<([^>]+)>;\s*rel="next"/)?.[1] || null;

          if (!events.length) break;

          let oldestEventLocalDateStr = null;
          events.forEach((e) => {
            if (e.created_at) {
              eventTimestamps.push(e.created_at);
              const localDateStr = toLocalDateString(e.created_at, streakTimeZone);
              oldestEventLocalDateStr = localDateStr;
            }
          });

          if (oldestEventLocalDateStr && oldestEventLocalDateStr < yesterdayStr) break;
        }

        githubStreak = calculateGithubStreak(eventTimestamps, streakTimeZone);
      } catch (err) {
        console.warn("GitHub events retrieval failed for streak:", err);
      }
      // --- End streak calculation ---

      const gitRankPoints =
        commits * 2 + prs * 5 + reviews * 10 + githubStreak * 10;

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
      const rateLimitMsg = getRateLimitMessage(error);
      if (rateLimitMsg) {
        console.warn("Rate limit hit:", rateLimitMsg);
        throw new Error(rateLimitMsg, { cause: error });
      }
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
      if (Date.now() - lastSyncTime < cooldownMs) return;
    }

    try {
      const ghStats = await fetchGitHubStats(
        user.uid,
        userData.githubUsername,
        userData.timezone
      );
      const userRef = doc(db, "users", user.uid);

      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) throw new Error("User document does not exist in Firestore!");

      const liveData = userDoc.data();
      const currentReferralPoints = liveData.points?.referralPoints || 0;
      const currentCodingVersePoints = liveData.points?.codingVersePoints || 0;
      const currentStreakPoints = liveData.points?.streakPoints || 0;

      const newGitRankPoints = ghStats.gitRankPoints;
      const newTotalPoints =
        newGitRankPoints +
        currentReferralPoints +
        currentCodingVersePoints +
        currentStreakPoints;

      const batch = writeBatch(db);
      batch.update(userRef, {
        "githubStats.commits": ghStats.commits,
        "githubStats.prs": ghStats.prs,
        "githubStats.reviews": ghStats.reviews,
        "githubStats.repos": ghStats.publicRepos,
        "githubStats.stars": ghStats.stars,
        "githubStats.followers": ghStats.followers,
        "githubStats.primaryLanguage": ghStats.primaryLanguage,
        githubStreak: ghStats.githubStreak,
        "points.gitRankPoints": newGitRankPoints,
        "points.totalPoints": newTotalPoints,
        "points.trustScore": ghStats.trustScore,
        lastSync: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      const rateLimitMsg = getRateLimitMessage(error);
      if (rateLimitMsg) {
        console.warn("Sync blocked by rate limit:", rateLimitMsg);
        throw new Error(rateLimitMsg, { cause: error });
      }
      console.error("Background GitHub sync failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isOnboarding,
        login,
        logout,
        fetchGitHubStats,
        syncGitHubData,
        ghAccessToken,
        setUserData,
        purchaseMascot,
        equipMascot
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};