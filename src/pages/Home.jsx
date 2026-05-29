import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Award,
  Users,
  Zap,
  Target,
  Trophy,
  UserPlus,
  Gift
} from "lucide-react";
import { Github } from "../components/ui/Icons";
import { fadeUp, staggerContainer } from "../utils/motion";
import GradientButton from "../components/ui/GradientButton";
import Card from "../components/ui/Card";
import logo from "../assets/logo.png";

export const Home = () => {
  const featureRailRef = useRef(null);

  const scrollFeatures = (direction) => {
    const rail = featureRailRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction * Math.min(rail.clientWidth * 0.85, 420),
      behavior: "smooth"
    });
  };

  const features = [
    {
      title: "GitRank",
      description: "Analyze commits, pull requests, and reviews to rank developers globally and by language.",
      icon: Github,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      accent: "from-blue-500/20 via-cyan-500/10 to-transparent",
      stats: "PRs, reviews, language ranks",
      status: "Contribution intelligence"
    },
    {
      title: "RankHer",
      description:"A spotlight ranking and community to support female software engineers.",
      icon: Sparkles,
      color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
      accent: "from-pink-500/20 via-rose-500/10 to-transparent",
      stats: "Spotlights, cohorts, recognition",
      status: "Inclusive rankings"
    },
    {
      title: "CodingVerse",
      description: "Solve daily algorithmic challenges, earn points, and climb the problem-solving ladder.",
      icon: Code2,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      accent: "from-violet-500/20 via-indigo-500/10 to-transparent",
      stats: "Daily practice, XP, ladders",
      status: "Challenge arena"
    },
    {
      title: "CodingOwl",
      description: "Build ironclad habits. Follow streaks and focus sessions backed by a focused habit assistant.",
      icon: BookOpen,
      color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
      accent: "from-amber-500/20 via-orange-500/10 to-transparent",
      stats: "Streaks, focus sessions, rituals",
      status: "Habit companion"
    },
    {
      title: "Achievements System",
      description: "Turn consistent progress into badges, milestone trophies, and profile-ready proof of work.",
      icon: Trophy,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      accent: "from-emerald-500/20 via-teal-500/10 to-transparent",
      stats: "Badges, trophies, milestones",
      status: "Progress rewards"
    },
    {
      title: "Friends System",
      description: "Follow peers, compare momentum, and keep developer growth social without adding noise.",
      icon: UserPlus,
      color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
      accent: "from-sky-500/20 via-blue-500/10 to-transparent",
      stats: "Followers, activity, peer ranks",
      status: "Social coding graph"
    },
    {
      title: "Referral System",
      description: "Invite developers into the platform and reward community growth with meaningful perks.",
      icon: Gift,
      color: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
      accent: "from-fuchsia-500/20 via-purple-500/10 to-transparent",
      stats: "Invites, rewards, growth loops",
      status: "Community expansion"
    }
  ];

  const valueProps = [
    { label: "Tracked Developers", value: "85,420+", icon: Users },
    { label: "Challenges Solved", value: "1.2M+", icon: Target },
    { label: "Pull Requests Analyzed", value: "3.4M+", icon: Zap },
    { label: "Global Badges Issued", value: "24,000+", icon: Award }
  ];

  return (
    <div className="relative w-full overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blob-purple-strong pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blob-blue-strong pointer-events-none -z-10 animate-pulse-slow" />

      <section className="relative min-h-screen w-full py-20 md:py-28 overflow-hidden flex items-center">
        <video
          className="absolute top-0 left-0 w-full h-[90%] object-cover opacity-50 pointer-events-none"
          src="/banner.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />

        <div className="absolute top-0 left-0 w-full h-[90%] bg-white/60 dark:bg-black/60 pointer-events-none" />

        <div className="relative z-10 w-full px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1, 0.05)}
            className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-left"
          >
            <div className="flex-1 space-y-6">
              <motion.span
                variants={fadeUp()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 backdrop-blur-sm"
              >
                The Developer Gamification Platform
              </motion.span>

              <motion.h1
                variants={fadeUp()}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white my-0"
              >
                Level Up Your Code. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500">
                  Claim Your Leaderboard Rank.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp()}
                className="text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium"
              >
                RankerHub tracks commits, streaks, and problem-solving to gamify your software development journey. Build habits, spotlight contributions, and earn badges.
              </motion.p>

              <motion.div
                variants={fadeUp()}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Link to="/login">
                  <GradientButton className="w-full sm:w-auto flex items-center justify-center">
                    Get Started <ArrowRight className="w-4 h-4 ml-1" />
                  </GradientButton>
                </Link>
               <a href="https://github.com/indresh404/RankerHub"
  target="_blank"
  rel="noopener noreferrer"
>
  <GradientButton variant="secondary" className="w-full sm:w-auto">
    View on GitHub
  </GradientButton>
</a>
              </motion.div>
            </div>

            <motion.div variants={fadeUp()} className="flex-shrink-0">
              <div className="rotating-gradient-border w-48 h-48 md:w-56 md:h-56 shadow-2xl transition-transform duration-300 hover:scale-105">
                <div className="w-[calc(100%-8px)] h-[calc(100%-8px)] rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-950 z-10">
                  <img src={logo} alt="RankerHub Big Logo" className="w-full h-full object-cover" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {valueProps.map((prop) => {
            const Icon = prop.icon;
            return (
              <div key={prop.label} className="space-y-1">
                <div className="flex items-center justify-center text-violet-500 mb-2">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="block text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {prop.value}
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {prop.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section id="features" className="py-20 px-6 max-w-6xl mx-auto space-y-8" aria-labelledby="features-heading">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex w-fit items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
              Feature suite
            </span>
            <h2 id="features-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white my-0">
              Everything developers need to turn progress into rank.
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium leading-7">
              A connected set of ranking, learning, habit, achievement, social, and referral systems designed for a modern developer platform.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2" aria-label="Feature carousel controls">
            <button
              type="button"
              onClick={() => scrollFeatures(-1)}
              className="h-10 w-10 rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-500/40 hover:text-violet-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-violet-300"
              aria-label="Scroll feature cards left"
            >
              <ChevronLeft className="mx-auto h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollFeatures(1)}
              className="h-10 w-10 rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-500/40 hover:text-violet-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-violet-300"
              aria-label="Scroll feature cards right"
            >
              <ChevronRight className="mx-auto h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={featureRailRef}
          className="scrollbar-none -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-4 pt-2 touch-pan-x"
          role="list"
          aria-label="RankerHub feature cards"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                glow={false}
                role="listitem"
                className="group relative h-[340px] min-w-[82vw] snap-start overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10 sm:min-w-[360px] md:min-w-[380px] lg:min-w-[400px]"
              >
                <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${feature.accent}`} aria-hidden="true" />
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm transition duration-300 group-hover:scale-105 ${feature.color}`}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <span className="rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700/70 dark:bg-slate-950/40 dark:text-slate-400">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                        {feature.status}
                      </p>
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-white/55 px-4 py-3 shadow-sm transition duration-300 group-hover:border-violet-500/25 dark:border-slate-800/70 dark:bg-slate-950/35">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      Built around
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {feature.stats}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 sm:hidden">
          Swipe to view all features
        </p>
      </section>
    </div>
  );
};

export default Home;
