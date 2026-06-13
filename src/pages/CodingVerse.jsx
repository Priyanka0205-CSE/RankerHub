import React from "react";
import { Code2, Target, CheckCircle2, Award, Play } from "lucide-react";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import ComingSoonCard from "../components/ui/ComingSoonCard";

export const CodingVerse = () => {
  const categories = [
    { name: "Arrays & Hashing", count: 48, solved: 12, icon: Target },
    { name: "Two Pointers & Sliders", count: 32, solved: 8, icon: Code2 },
    { name: "Stacks & Queues", count: 24, solved: 4, icon: CheckCircle2 },
    { name: "Trees & Graphs", count: 56, solved: 15, icon: Award }
  ];

  const recentChallenges = [
    { id: 1, title: "Two Sum", difficulty: "Easy", diffColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25", xp: "+20 XP", category: "Arrays & Hashing" },
    { id: 2, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", diffColor: "text-amber-500 bg-amber-500/10 border-amber-500/25", xp: "+40 XP", category: "Two Pointers" },
    { id: 3, title: "Merge k Sorted Lists", difficulty: "Hard", diffColor: "text-red-500 bg-red-500/10 border-red-500/25", xp: "+80 XP", category: "Linked Lists" },
    { id: 4, title: "Trapping Rain Water", difficulty: "Hard", diffColor: "text-red-500 bg-red-500/10 border-red-500/25", xp: "+80 XP", category: "Arrays & Hashing" }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <SectionHeader
        title="CodingVerse Arena"
        subtitle="Test your engineering skills with daily coding assignments, mock interviews, and tournaments."
        badge="Practice Hub"
      />

      <ComingSoonCard
        title="Coding Challenges Arena - Coming Soon"
        description="Our browser-based IDE and code compilation compilers are in test staging. Support for Python, Javascript, Go, and Rust solvers will release in the next major build. Current buttons are placeholders."
        icon={Code2}
        features={[
          "Multi-language code compile sandbox",
          "Automated test case validation arrays",
          "Mock interview simulation rooms",
          "Time & space complexity benchmark comparisons"
        ]}
        estimatedArrival="Q3 2026"
        showHourglass={true}
      />

      {/* Hero Daily Challenge Panel */}
      <Card className="p-8 relative overflow-hidden bg-gradient-to-br from-purple-600/10 via-slate-50/0 to-slate-50/0 dark:from-purple-600/5 dark:via-slate-900/0 dark:to-slate-900/0 border-purple-500/15">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
              Daily Featured Challenge
            </span>
            
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white my-0 leading-tight">
              Edit Distance (Levensthein)
            </h2>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Given two strings <code className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">word1</code> and <code className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">word2</code>, return the minimum number of operations required to convert <code className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">word1</code> to <code className="bg-slate-200/50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs">word2</code>. You have three permitted operations: Insert, Delete, or Replace.
            </p>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-2">
              <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full border text-red-500 bg-red-500/10 border-red-500/25">
                Hard (80 XP)
              </span>
              <span>•</span>
              <span>Target Time: 45 mins</span>
            </div>
          </div>

          <button
            disabled
            className="w-full lg:w-auto px-8 py-3.5 rounded-xl font-bold bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300/10 cursor-not-allowed hover:bg-slate-200 active:scale-100 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-400 dark:fill-slate-500" /> Start Challenge
          </button>
        </div>
      </Card>

      {/* Grid Layout: Category list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <Card key={idx} className="p-5 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 w-11 h-11 flex items-center justify-center text-slate-500 border border-slate-200/20 dark:border-slate-800/20 group-hover:scale-110 transition-transform duration-200">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold block mt-1">
                    {cat.count} Challenges Available
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Solved</span>
                  <span>{cat.solved} / {cat.count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(cat.solved / cat.count) * 100}%` }}
                    className="h-full bg-violet-600 rounded-full"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Sub List: Challenge Catalog Table */}
      <Card className="p-6">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
            Algorithmic Catalog
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Solve problems to increase your global ranking XP.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm mt-4">
          {recentChallenges.map((item) => (
            <div
              key={item.id}
              className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors rounded-xl px-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-8.5 h-8.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-200/10 dark:border-slate-800/10">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950 dark:text-slate-200 leading-tight">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${item.diffColor}`}>
                  {item.difficulty}
                </span>

                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                  {item.xp}
                </span>

                <button
                  disabled
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300/5 cursor-not-allowed"
                >
                  Solve
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CodingVerse;
