import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { calculateRankingBreakdown } from "../../utils/rankingBreakdown";

export const RankingBreakdown = ({ userData }) => {
  const [expandedCategory, setExpandedCategory] = React.useState(null);
  const breakdown = useMemo(() => calculateRankingBreakdown(userData), [userData]);

  const categoryIcons = {
    "🐙 GitHub Contributions": "🐙",
    "💻 Coding Challenges": "💻",
    "🔥 Daily Streak": "🔥",
    "🤝 Referrals": "🤝"
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const progressPercentage = breakdown.nextMilestone.points > 0
    ? (breakdown.totalPoints / breakdown.nextMilestone.points) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="w-5 h-5 text-blue-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Why is my rank this value?
        </h2>
      </div>

      {/* Total Points Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Points</p>
              <p className="text-4xl font-bold text-slate-900 dark:text-white">
                {breakdown.totalPoints.toLocaleString()}
              </p>
            </div>
            {breakdown.rank && (
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Current Rank</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {breakdown.rank}
                </p>
              </div>
            )}
          </div>

          {/* Progress to Next Milestone */}
          {breakdown.nextMilestone.pointsNeeded > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Progress to {breakdown.nextMilestone.points.toLocaleString()} points
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {breakdown.nextMilestone.pointsNeeded.toLocaleString()} points needed
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Points Breakdown Categories */}
      <div className="space-y-3">
        {breakdown.pointsBreakdown.length > 0 ? (
          breakdown.pointsBreakdown.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">{categoryIcons[category.category]}</span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {category.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    +{category.points.toLocaleString()}
                  </span>
                  {expandedCategory === category.category ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: expandedCategory === category.category ? "auto" : 0,
                  opacity: expandedCategory === category.category ? 1 : 0
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700">
                  {category.details.map((detail, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 dark:text-slate-300">
                          {detail.label}
                        </span>
                        {detail.note && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({detail.note})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600 dark:text-slate-400">
                          {detail.value} × {detail.multiplier} =
                        </span>
                        <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                          {detail.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Start earning points by completing challenges, contributing to GitHub, or logging in daily!
            </p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800"
      >
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
          💡 Tips to boost your rank:
        </p>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
          <li>Contribute to GitHub (commits +2, PRs +5, reviews +10)</li>
          <li>Complete coding challenges (easy +100, medium +150, hard +200)</li>
          <li>Maintain your daily login streak (+10 per day, max 100/cycle)</li>
          <li>Refer friends and help them complete their first challenge (+100)</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default RankingBreakdown;
