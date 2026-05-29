import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Lock,
  Trophy,
  CheckCircle2,
  Zap,
  Star,
  Target,
  Sparkles
} from "lucide-react";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import ComingSoonCard from "../components/ui/ComingSoonCard";
import { systemBadges } from "../constants";
import { useAuth } from "../context/AuthContext";

export const Achievements = () => {
  const { userData } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState(systemBadges[0]);

  // Extract metrics dynamically from the live Firestore user document
  const commits = userData?.githubStats?.commits || 0;
  const streak = userData?.streak || 0;
  const codingVersePoints = userData?.points?.codingVersePoints || 0;

  // Calculate dynamic progress mapping for the 4 badges
  const badgeProgress = {
    b1: { unlocked: true, unlockedAt: "May 10, 2026", progress: 100, current: 1, target: 1, label: "First 100 users whitelist" },
    b2: { 
      unlocked: commits >= 100, 
      unlockedAt: commits >= 100 ? "Verified" : null, 
      progress: Math.min(100, Math.round((commits / 100) * 100)), 
      current: commits, 
      target: 100, 
      label: "GitHub Commits Audited" 
    },
    b3: { 
      unlocked: streak >= 10, 
      unlockedAt: streak >= 10 ? "Verified" : null, 
      progress: Math.min(100, Math.round((streak / 10) * 100)), 
      current: streak, 
      target: 10, 
      label: "Daily Consistency Streaks" 
    },
    b4: { 
      unlocked: codingVersePoints >= 100, 
      unlockedAt: codingVersePoints >= 100 ? "Verified" : null, 
      progress: Math.min(100, Math.round((codingVersePoints / 100) * 100)), 
      current: codingVersePoints, 
      target: 100, 
      label: "Frontend Arenas Solved (XP)" 
    }
  };

  // Dynamically calculate daily quests completion from actual platform performance
  const dailyQuests = [
    { 
      id: "q1", 
      title: "GitRank Explorer", 
      description: "Audit commits in any public repository", 
      xp: 50, 
      progress: commits > 0 ? 1 : 0, 
      target: 1, 
      completed: commits > 0 
    },
    { 
      id: "q2", 
      title: "Consistency Streak", 
      description: "Maintain your daily streak in CodingOwl", 
      xp: 100, 
      progress: streak > 0 ? 1 : 0, 
      target: 1, 
      completed: streak > 0 
    },
    { 
      id: "q3", 
      title: "Verse Conqueror", 
      description: "Solve a medium-difficulty problem in CodingVerse (40 XP each)", 
      xp: 150, 
      progress: Math.min(2, Math.floor(codingVersePoints / 40)), 
      target: 2, 
      completed: codingVersePoints >= 80 
    }
  ];

  const unlockedCount = Object.values(badgeProgress).filter((b) => b.unlocked).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        title="Achievements & Badges"
        subtitle="Complete milestones, unlock legendary badges, and show off your engineering ranking credentials."
        badge="System Active"
        badgeColor="bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20"
      />

      <ComingSoonCard
        title="Achievements Sync Engine - Coming Soon"
        description="Earned badges are locked to your local profile session. Automatic verification of smart contracts, badge minting, and cross-platform verification will be available in Q3 2026."
        icon={Award}
        features={[
          "Polygon blockchain badge minting (soulbound tokens)",
          "Verify credentials directly on your LinkedIn profile",
          "Unlock custom discord role integrations automatically",
          "Earn limited-edition seasonal tournament badges"
        ]}
        estimatedArrival="Q3 2026"
        showHourglass={true}
      />

      {/* Main Grid: Left side Badges list, Right side detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Badge List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Developer Badges
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50">
              {unlockedCount} of 4 Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {systemBadges.map((badge) => {
              const info = badgeProgress[badge.id] || { unlocked: false, progress: 0 };
              const isSelected = selectedBadge.id === badge.id;

              return (
                <Card
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-5 flex items-center gap-4 cursor-pointer border transition-all duration-300 ${
                    isSelected
                      ? "border-violet-500 ring-2 ring-violet-500/10 shadow-lg"
                      : "border-slate-200/50 dark:border-slate-800/50 hover:border-slate-400/30 hover:shadow-md"
                  }`}
                >
                  {/* Badge Visual Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg relative flex-shrink-0 ${
                      !info.unlocked ? "brightness-75 saturate-50" : ""
                    }`}
                  >
                    <span className="text-xl font-black text-white uppercase">{badge.name[0]}</span>
                    
                    {/* Locked / Unlocked Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                      {info.unlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate my-0">
                        {badge.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {info.progress}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {badge.description}
                    </p>

                    {/* Simple Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${info.progress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Daily Quests Board */}
          <div className="pt-4 space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-500" />
              Daily Quests
            </h3>

            <div className="space-y-3">
              {dailyQuests.map((quest) => (
                <Card
                  key={quest.id}
                  className={`p-4 flex items-center justify-between gap-4 border border-slate-200/50 dark:border-slate-800/50 transition-all ${
                    quest.completed ? "bg-emerald-500/5 dark:bg-emerald-500/2 border-emerald-500/20" : ""
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold text-sm ${quest.completed ? "text-emerald-500 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                        {quest.title}
                      </span>
                      {quest.completed && (
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                          Claimed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal my-0">
                      {quest.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Quest Progress Indicator */}
                    <span className="text-xs font-bold text-slate-400">
                      {quest.progress} / {quest.target}
                    </span>

                    {/* XP reward */}
                    <div className="flex items-center gap-1 bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20 px-2 py-1 rounded-lg text-xs font-black">
                      <Zap className="w-3 h-3 fill-current" />
                      +{quest.xp} XP
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Selected Badge Detailed Panel */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Badge Details
          </h3>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBadge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 border border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-950/40 relative overflow-hidden">
                {/* Decorative absolute element */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${selectedBadge.color} opacity-5 blur-[40px] pointer-events-none rounded-full`} />

                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                  {/* Glowing Big Badge representation */}
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${selectedBadge.color} flex items-center justify-center shadow-xl shadow-indigo-500/10 relative`}>
                    <span className="text-4xl font-black text-white uppercase">{selectedBadge.name[0]}</span>
                    
                    {/* Orbit Ring */}
                    <div className="absolute inset-0 rounded-3xl border border-white/20 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white my-0">
                      {selectedBadge.name}
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mt-1">
                      {badgeProgress[selectedBadge.id]?.unlocked ? "Status: Unlocked" : "Status: In Progress"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold max-w-xs leading-relaxed italic bg-white/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/30 dark:border-slate-800/30">
                    "{selectedBadge.description}"
                  </p>

                  <div className="w-full pt-4 border-t border-slate-200/40 dark:border-slate-800/40 text-left space-y-3.5">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Criteria</span>
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200 block mt-0.5">
                        {badgeProgress[selectedBadge.id]?.label}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Milestone Progress</span>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                        <span>{badgeProgress[selectedBadge.id]?.current} earned</span>
                        <span>of {badgeProgress[selectedBadge.id]?.target} required</span>
                      </div>
                      
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                          style={{ width: `${badgeProgress[selectedBadge.id]?.progress}%` }}
                        />
                      </div>
                    </div>

                    {badgeProgress[selectedBadge.id]?.unlocked ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold justify-center">
                        <Star className="w-4 h-4 fill-current" />
                        Unlocked on {badgeProgress[selectedBadge.id]?.unlockedAt}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300/10 text-slate-400 dark:text-slate-500 text-xs font-semibold justify-center cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                        Complete criteria to unlock
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};

export default Achievements;
