import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { getLevelInfo } from '../utils/gameEngine';

// Animated counter hook
function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = value;
    startTimeRef.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(startRef.current + (target - startRef.current) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

// SVG Progress Ring component
const ProgressRing: React.FC<{
  radius: number;
  stroke: number;
  progress: number;
  gradientId: string;
  colors: [string, string];
  size?: number;
  className?: string;
}> = ({ radius, stroke, progress, gradientId, colors, size, className = '' }) => {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
  const svgSize = size || (radius + stroke) * 2;

  return (
    <svg className={`transform -rotate-90 ${className}`} width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <circle
        cx={svgSize / 2} cy={svgSize / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={stroke}
        className="text-white/[0.04]"
      />
      <circle
        cx={svgSize / 2} cy={svgSize / 2} r={radius}
        fill="none" stroke={`url(#${gradientId})`} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-animated"
      />
    </svg>
  );
};

export const Dashboard: React.FC = () => {
  const { profile } = useApp();
  if (!profile) return null;
  return <DashboardContent profile={profile} />;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DashboardContent: React.FC<{ profile: any }> = ({ profile }) => {
  const {
    quests,
    toggleQuest,
    attributes,
    workoutSessions,
    achievements,
    showQuestCompleteGlow,
    setShowQuestCompleteGlow
  } = useApp();

  const { theme } = useAppTheme();

  const [reflection, setReflection] = useState(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`forge_reflection_${todayStr}`) || '';
  });

  const handleSaveReflection = (val: string) => {
    setReflection(val);
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`forge_reflection_${todayStr}`, val);
  };



  const lvlInfo = getLevelInfo(profile.xp, theme);
  const animatedLevel = useAnimatedNumber(lvlInfo.level);
  const animatedXp = useAnimatedNumber(lvlInfo.currentXp);
  const animatedProgress = useAnimatedNumber(Math.round(lvlInfo.progressPercentage), 1400);
  const growthScore = Math.round((attributes.strength + attributes.discipline + attributes.consistency) / 3);
  const animatedGrowth = useAnimatedNumber(growthScore, 1500);

  const [now] = useState(() => Date.now());
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const weeklyMissions = [
    { name: 'Complete 3 Workouts', current: workoutSessions.filter(s => {
      return new Date(s.completed_at).getTime() >= oneWeekAgo;
    }).length, target: 3 },
    { name: 'Average 8k Steps', current: attributes.agility >= 50 ? 8200 : 4500, target: 8000 },
    { name: 'Unlock Achievement', current: achievements.filter(a => a.unlocked).length > 0 ? 1 : 0, target: 1 }
  ];

  const getQuestIcon = (category: string) => {
    switch (category) {
      case 'workout': return 'fitness_center';
      case 'protein': return 'restaurant';
      case 'water': return 'water_drop';
      case 'steps': return 'directions_walk';
      case 'sleep': return 'bedtime';
      default: return 'task_alt';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 relative"
    >
      {/* QUEST COMPLETE OVERLAY */}
      <AnimatePresence>
        {showQuestCompleteGlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col items-center justify-center cinematic-backdrop cursor-pointer"
            onClick={() => setShowQuestCompleteGlow(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`text-center p-10 max-w-lg mx-4 border relative overflow-hidden ${
                theme === 'FORGE'
                  ? 'bg-[#0a0c0e] border-[#f59e0b]/40 shadow-[0_0_80px_rgba(245,158,11,0.25)]'
                  : 'ascend-card shadow-[0_0_100px_rgba(168,85,247,0.3)]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {theme === 'ASCEND' && <div className="ascend-radial-halo" />}
              <motion.span 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                className={`text-6xl block mb-6 drop-shadow-[0_0_20px_rgba(var(--color-primary),0.8)]`}
              >
                ⚡
              </motion.span>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-widest mb-3 uppercase text-primary drop-shadow-[0_0_15px_rgba(var(--color-primary),0.5)]">
                {theme === 'FORGE' ? 'OBJECTIVES SECURED' : 'TRANSCENDENCE'}
              </h2>
              <p className="font-label text-[10px] tracking-[0.3em] text-on-surface-variant mb-8 font-bold">
                {theme === 'FORGE' ? 'ALL DAILY MISSIONS COMPLETE' : 'ALL ACTIONS COMPLETED'}
              </p>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="py-5 px-10 bg-background/50 border border-outline-variant/30 inline-flex flex-col gap-1 mb-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" 
                style={{ borderRadius: theme === 'FORGE' ? '0' : '16px' }}
              >
                <span className={`font-display text-4xl font-black text-primary ${theme === 'FORGE' ? 'forge-glow' : 'ascend-glow'}`}>+300 XP</span>
                <span className="font-label text-[9px] tracking-wider text-on-surface-variant font-bold">PROGRESS RECORDED</span>
              </motion.div>
              <p className="font-body text-xs text-on-surface-variant/70 italic px-4 mb-8">
                {theme === 'FORGE'
                  ? '"Discipline is the forge. You are becoming unbreakable."'
                  : '"Growth is a quiet accumulation of small victories."'}
              </p>
              <button
                className="px-10 py-4 bg-primary text-background font-label text-xs font-extrabold uppercase tracking-widest hover:opacity-90 transition-opacity press-scale shadow-[0_0_20px_rgba(var(--color-primary),0.3)]"
                onClick={() => setShowQuestCompleteGlow(false)}
                style={{ borderRadius: theme === 'FORGE' ? '0' : '12px' }}
              >
                CONTINUE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          FORGE DASHBOARD
         ══════════════════════════════════════════════ */}
      {theme === 'FORGE' ? (
        <div className="flex flex-col gap-8">

          {/* HERO: Level + XP */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Level block */}
            <motion.div variants={itemVariants} className="md:col-span-4 forge-panel p-8 flex flex-col justify-between min-h-[200px]">
              <div>
                <span className="font-label text-[9px] text-on-surface-variant tracking-[0.3em] block">DESIGNATION</span>
                <span className="font-label text-xs uppercase tracking-widest text-[#f59e0b] font-bold mt-1 block">{lvlInfo.title}</span>
              </div>
              <div className="flex items-end justify-between mt-6">
                <span className="font-display text-[96px] md:text-[120px] font-black leading-none text-on-surface tracking-tighter" style={{ lineHeight: '0.85' }}>
                  {animatedLevel}
                </span>
                <span className="font-label text-[9px] text-on-surface-variant tracking-widest mb-2">LEVEL</span>
              </div>
            </motion.div>

            {/* XP + Ring */}
            <motion.div variants={itemVariants} className="md:col-span-5 forge-panel p-8 flex items-center gap-8">
              <div className="relative flex-shrink-0">
                <ProgressRing
                  radius={52} stroke={5} progress={animatedProgress}
                  gradientId="forgeXpRing" colors={['#b45309', '#fbbf24']} size={120}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold text-[#f1f5f9]">{animatedProgress}%</span>
                  <span className="font-label text-[7px] text-[#64748b] tracking-widest">CAPACITY</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <div>
                  <span className="font-label text-[9px] text-on-surface-variant tracking-[0.3em] block">XP ENGINE</span>
                  <span className="font-label text-sm text-on-surface font-bold mt-1 block tracking-wide">
                    {animatedXp.toLocaleString()} <span className="text-on-surface-variant font-normal">/ {lvlInfo.xpNeededForNext.toLocaleString()} XP</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest border border-outline-variant">
                  <div className="h-full progress-gradient transition-all duration-1000" style={{ width: `${animatedProgress}%` }} />
                </div>
                <div className="flex justify-between text-[8px] text-on-surface-variant font-label tracking-widest">
                  <span>LVL {lvlInfo.level}</span>
                  <span>LVL {lvlInfo.level + 1}</span>
                </div>
              </div>
            </motion.div>

            {/* Streak + Stats */}
            <motion.div variants={itemVariants} className="md:col-span-3 forge-panel p-8 flex flex-col justify-between">
              <span className="font-label text-[9px] text-on-surface-variant tracking-[0.3em] block">OPERATIONAL STATUS</span>
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#f59e0b] text-lg animate-flame" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  <div>
                    <span className="font-display text-2xl font-bold text-on-surface">{profile.streak}</span>
                    <span className="font-label text-[8px] text-on-surface-variant tracking-widest ml-1">DAY STREAK</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">fitness_center</span>
                  <div>
                    <span className="font-label text-sm font-bold text-on-surface">{workoutSessions.length}</span>
                    <span className="font-label text-[8px] text-on-surface-variant tracking-widest ml-1">SESSIONS</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">military_tech</span>
                  <div>
                    <span className="font-label text-sm font-bold text-on-surface">{achievements.filter(a => a.unlocked).length}</span>
                    <span className="font-label text-[8px] text-on-surface-variant tracking-widest ml-1">BADGES</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ATTRIBUTES */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { name: 'STRENGTH', value: attributes.strength, color: '#ef4444' },
              { name: 'DISCIPLINE', value: attributes.discipline, color: '#f59e0b' },
              { name: 'CONSISTENCY', value: attributes.consistency, color: '#3b82f6' },
              { name: 'ENDURANCE', value: attributes.endurance, color: '#22c55e' },
              { name: 'AGILITY', value: attributes.agility, color: '#a855f7' },
            ].map((attr) => (
              <motion.div variants={itemVariants} key={attr.name} className={`forge-panel p-5 hover-lift press-scale`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-label text-[8px] tracking-[0.2em]" style={{ color: attr.color }}>{attr.name}</span>
                </div>
                <span className="font-display text-3xl font-bold text-on-surface block">{attr.value}</span>
                <div className="w-full h-1 bg-surface-container-highest mt-3 overflow-hidden">
                  <div className="h-full transition-all duration-1000" style={{ width: `${attr.value}%`, background: attr.color }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* MISSIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Daily */}
            <motion.div variants={itemVariants} className="forge-panel p-6 lg:col-span-7">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-outline-variant">
                <h3 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface">Daily Missions</h3>
                <span className="font-label text-[10px] text-[#f59e0b] font-bold">{quests.filter(q => q.completed).length}/5 SECURED</span>
              </div>
              <div className="flex flex-col gap-2">
                {quests.map((quest, i) => (
                  <button
                    key={quest.id}
                    onClick={() => toggleQuest(quest.id)}
                    className={`p-4 flex items-center justify-between transition-all press-scale text-left border animate-fade-in-up ${
                      quest.completed
                        ? 'bg-[#f59e0b]/[0.06] border-[#f59e0b]/30'
                        : 'bg-transparent border-outline-variant hover:border-outline'
                    }`}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`material-symbols-outlined text-lg ${quest.completed ? 'text-[#f59e0b]' : 'text-[#64748b]'}`}>
                        {getQuestIcon(quest.category)}
                      </span>
                      <div>
                        <h4 className={`font-label text-xs font-bold uppercase ${quest.completed ? 'text-on-surface' : 'text-on-surface-variant'}`}>{quest.name}</h4>
                        <span className="font-label text-[8px] text-on-surface-variant/70 tracking-wider">TARGET: {quest.target} {quest.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-label text-[9px] text-[#f59e0b] font-bold">+{quest.xpReward}</span>
                      <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                        quest.completed ? 'border-[#f59e0b] bg-[#f59e0b]' : 'border-outline'
                      }`}>
                        {quest.completed && <span className="material-symbols-outlined text-[12px] text-[#050607] font-black">check</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Weekly */}
            <motion.div variants={itemVariants} className="forge-panel p-6 lg:col-span-5">
              <h3 className="font-label text-xs font-bold uppercase tracking-widest text-on-surface mb-5 pb-3 border-b border-outline-variant">Weekly Directives</h3>
              <div className="flex flex-col gap-5">
                {weeklyMissions.map((wm, i) => {
                  const percent = Math.min(100, (wm.current / wm.target) * 100);
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-label text-xs text-on-surface font-bold uppercase">{wm.name}</span>
                        <span className="font-display text-sm text-[#f59e0b] font-bold">{Math.round(percent)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-highest border border-outline-variant overflow-hidden">
                        <div className="h-full progress-gradient transition-all duration-1000" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════
           ASCEND DASHBOARD
           ══════════════════════════════════════════════ */
        <div className="flex flex-col gap-8">

          {/* HERO */}
          <motion.div variants={itemVariants} className="relative p-8 ascend-card overflow-hidden">
            <div className="ascend-radial-halo" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div>
                <p className="font-label text-[10px] text-primary/70 tracking-[0.3em] uppercase font-medium">The path of growth</p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface mt-2">
                  Welcome back, <span className="text-primary">{profile.name || 'Seeker'}</span>
                </h1>
              </div>
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary/[0.06] border border-primary/[0.12] text-xs font-label">
                <span className="material-symbols-outlined text-[#22d3ee] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <span className="text-on-surface-variant">Streak</span>
                <span className="text-on-surface font-bold">{profile.streak}d</span>
              </div>
            </div>
          </motion.div>

          {/* Level + Growth + Reflection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Level */}
            <motion.div variants={itemVariants} className="ascend-card p-8 flex flex-col items-center justify-center text-center relative hover-lift">
              <div className="ascend-radial-halo" />
              <div className="relative">
                <ProgressRing
                  radius={48} stroke={3} progress={animatedProgress}
                  gradientId="ascendLvlRing" colors={['#7c3aed', '#22d3ee']} size={108}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-label text-[8px] text-primary/50 tracking-widest">LEVEL</span>
                  <span className="font-display text-4xl font-bold text-on-surface leading-none mt-0.5">{animatedLevel}</span>
                </div>
              </div>
              <h4 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-medium mt-5">{lvlInfo.title}</h4>
              <span className="font-label text-[8px] text-primary/40 tracking-wider mt-1">{animatedXp.toLocaleString()} / {lvlInfo.xpNeededForNext.toLocaleString()} XP</span>
            </motion.div>

            {/* Growth Score */}
            <motion.div variants={itemVariants} className="ascend-card p-8 flex flex-col justify-between hover-lift">
              <div>
                <h4 className="font-label text-[10px] uppercase tracking-[0.2em] text-primary font-medium">Growth Score</h4>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="font-display text-5xl font-bold text-on-surface">{animatedGrowth}</span>
                  <span className="font-label text-sm text-[#8b8fa4]">/100</span>
                </div>
              </div>
              <div className="mt-6">
                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full progress-gradient rounded-full transition-all duration-1500" style={{ width: `${animatedGrowth}%` }} />
                </div>
                <p className="font-body text-[10px] text-[#8b8fa4] mt-3 leading-relaxed">
                  Composite of strength, discipline, and consistency metrics.
                </p>
              </div>
            </motion.div>

            {/* Reflection */}
            <motion.div variants={itemVariants} className="ascend-card p-8 flex flex-col hover-lift">
              <h4 className="font-label text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-4">Daily Reflection</h4>
              <textarea
                value={reflection}
                onChange={(e) => handleSaveReflection(e.target.value)}
                className="flex-1 bg-transparent border-0 resize-none outline-none focus:ring-0 text-xs font-body text-[#cbd5e1] leading-relaxed placeholder-white/15 min-h-[100px]"
                placeholder="What did I learn today? What will I do differently tomorrow?"
                rows={4}
              />
              <span className="font-label text-[7px] text-white/20 tracking-widest text-right uppercase mt-3">AUTO-SAVING</span>
            </motion.div>
          </div>

          {/* Actions + Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Daily Actions */}
            <motion.div variants={itemVariants} className="ascend-card p-6 lg:col-span-8">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-outline-variant/30">
                <h3 className="font-label text-xs uppercase tracking-widest text-on-surface font-medium">Daily Actions</h3>
                <span className="font-label text-[9px] text-[#8b8fa4]">{quests.filter(q => q.completed).length} / 5</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quests.map((quest, i) => (
                  <button
                    key={quest.id}
                    onClick={() => toggleQuest(quest.id)}
                    className={`p-4 rounded-xl border transition-all press-scale text-left flex items-center justify-between animate-fade-in-up ${
                      quest.completed
                        ? 'bg-primary/[0.06] border-primary/20'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-base ${quest.completed ? 'text-[#22d3ee]' : 'text-[#8b8fa4]'}`}>
                        {getQuestIcon(quest.category)}
                      </span>
                      <div>
                        <h4 className={`text-xs font-medium uppercase ${quest.completed ? 'text-white' : 'text-[#8b8fa4]'}`}>{quest.name}</h4>
                        <span className="font-label text-[8px] text-white/20">{quest.target} {quest.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-label text-[8px] text-[#22d3ee] font-bold">+{quest.xpReward}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        quest.completed ? 'border-primary bg-primary' : 'border-white/15'
                      }`}>
                        {quest.completed && <span className="material-symbols-outlined text-[10px] text-background font-black">check</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Metrics Sidebar */}
            <motion.div variants={itemVariants} className="ascend-card p-6 lg:col-span-4 flex flex-col gap-5">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface font-medium pb-3 border-b border-outline-variant/30">Mind & Body</h3>
              {[
                { label: 'STRENGTH', value: attributes.strength, color: '#ef4444' },
                { label: 'DISCIPLINE', value: attributes.discipline, color: '#a855f7' },
                { label: 'CONSISTENCY', value: attributes.consistency, color: '#22d3ee' },
                { label: 'ENDURANCE', value: attributes.endurance, color: '#22c55e' },
                { label: 'AGILITY', value: attributes.agility, color: '#f59e0b' },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                  <span className="font-label text-[9px] text-on-surface-variant tracking-wider flex-1 uppercase">{m.label}</span>
                  <span className="font-label text-xs text-on-surface font-bold">{m.value}</span>
                  <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${m.value}%`, background: m.color }} />
                  </div>
                </div>
              ))}

              {/* XP Progress */}
              <div className="mt-3 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-label text-[8px] text-[#8b8fa4] tracking-widest uppercase">XP Progress</span>
                  <span className="font-label text-[9px] text-primary font-bold">{animatedProgress}%</span>
                </div>
                <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full progress-gradient rounded-full transition-all duration-1000" style={{ width: `${animatedProgress}%` }} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
