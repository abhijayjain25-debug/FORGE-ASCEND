import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from './contexts/AppContext';
import { useAppTheme } from './contexts/ThemeContext';
import { ShaderBackground } from './components/ShaderBackground';
import { Dashboard } from './views/Dashboard';
import { Workouts } from './views/Workouts';
import { Nutrition } from './views/Nutrition';
import { Progress } from './views/Progress';
import { Achievements } from './views/Achievements';
import { Settings } from './views/Settings';
import { Auth } from './views/Auth';
import { Onboarding } from './views/Onboarding';
import { getLevelInfo } from './utils/gameEngine';

export const App: React.FC = () => {
  const {
    profile,
    activeTab,
    setActiveTab,
    justLeveledUp,
    setJustLeveledUp,
    newAchievementUnlocked,
    setNewAchievementUnlocked,
    loading,
    error,
    authMode,
    setAuthMode,
    refreshData,
    isAuthenticated
  } = useApp();

  const { theme, toggleTheme, mode, toggleMode } = useAppTheme();

  useEffect(() => {
    if (newAchievementUnlocked) {
      const timer = setTimeout(() => setNewAchievementUnlocked(null), 6000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAchievementUnlocked]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'workouts': return <Workouts />;
      case 'nutrition': return <Nutrition />;
      case 'progress': return <Progress />;
      case 'achievements': return <Achievements />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-background p-6 text-center">
        <div className="max-w-md p-8 border border-red-500/20 bg-red-950/10 flex flex-col items-center gap-4 animate-scale-in" style={{ borderRadius: theme === 'FORGE' ? '0' : '16px' }}>
          <span className="material-symbols-outlined text-4xl text-red-500">warning</span>
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">Sync Failure</h2>
          <p className="font-body text-xs text-on-surface-variant">{error}</p>
          <div className="flex gap-4 mt-2">
            <button onClick={() => refreshData()} className="px-5 py-2.5 bg-primary text-background font-label text-xs font-bold uppercase tracking-widest press-scale" style={{ borderRadius: theme === 'FORGE' ? '0' : '8px' }}>Retry</button>
            <button onClick={() => setAuthMode('local')} className="px-5 py-2.5 border border-outline text-primary font-label text-xs font-bold uppercase tracking-widest press-scale" style={{ borderRadius: theme === 'FORGE' ? '0' : '8px' }}>Go Offline</button>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <div className="w-10 h-10 border-2 border-t-primary border-primary/10 rounded-full animate-spin" />
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-primary/60">
            {theme === 'FORGE' ? 'FORGING INTERFACE' : 'ASCENDING'}
          </span>
        </div>
      </div>
    );
  }

  // Auth gate
  if (authMode === 'supabase' && !isAuthenticated) {
    return (
      <div className="min-h-screen font-body text-on-background bg-background flex relative overflow-x-hidden">
        <ShaderBackground />
        <Auth onAuthSuccess={() => refreshData()} onEnterSandbox={() => setAuthMode('local')} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <div className="w-10 h-10 border-2 border-t-primary border-primary/10 rounded-full animate-spin" />
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-primary/60">Initializing</span>
        </div>
      </div>
    );
  }

  // Onboarding gate
  if (profile.is_onboarded === false) {
    return (
      <div className="min-h-screen font-body text-on-background bg-background flex relative overflow-x-hidden">
        <ShaderBackground />
        <Onboarding onComplete={() => refreshData()} />
      </div>
    );
  }

  const lvlInfo = getLevelInfo(profile.xp, theme);

  const navItems = [
    { id: 'dashboard', label: 'Command', icon: 'space_dashboard' },
    { id: 'workouts', label: 'Train', icon: 'fitness_center' },
    { id: 'nutrition', label: 'Fuel', icon: 'restaurant_menu' },
    { id: 'progress', label: 'Progress', icon: 'analytics' },
    { id: 'achievements', label: 'Trophies', icon: 'emoji_events' },
    { id: 'settings', label: 'System', icon: 'tune' },
  ];

  return (
    <div className="min-h-screen font-body text-on-background bg-background transition-colors duration-700 flex relative overflow-x-hidden">

      <ShaderBackground />

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <nav className={`fixed left-0 top-0 h-full w-[260px] hidden lg:flex flex-col z-50 p-6 gap-4 border-r transition-all ${
        theme === 'FORGE'
          ? 'bg-surface/95 border-outline-variant backdrop-blur-sm'
          : 'bg-surface/80 backdrop-blur-xl border-outline-variant'
      }`}>
        {/* Branding */}
        <div className="px-1 mb-2 pt-4">
          <h1 className="font-display text-xl font-bold tracking-wider text-primary uppercase">
            {theme === 'FORGE' ? 'FORGE' : 'ASCEND'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-label text-[8px] text-on-surface-variant tracking-[0.25em] uppercase">
              LVL {lvlInfo.level} — {lvlInfo.title}
            </span>
          </div>
          {/* Mini XP bar */}
          <div className={`w-full h-1 mt-3 overflow-hidden ${theme === 'FORGE' ? 'bg-surface-container-high' : 'bg-white/[0.06] rounded-full'}`}>
            <div className="h-full progress-gradient transition-all duration-1000" style={{ width: `${lvlInfo.progressPercentage}%`, borderRadius: theme === 'ASCEND' ? '999px' : '0' }} />
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 flex flex-col gap-1 mt-4">
          {navItems.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3.5 w-full text-left px-4 py-3 transition-all font-label text-[11px] uppercase tracking-widest press-scale ${
                  active
                    ? theme === 'FORGE'
                      ? 'text-[#f59e0b] bg-[#f59e0b]/[0.06] border-l-2 border-[#f59e0b]'
                      : 'text-primary bg-primary/[0.08] rounded-xl'
                    : 'text-[#64748b] hover:text-on-surface hover:bg-white/[0.02]'
                }`}
                style={{ borderRadius: !active && theme === 'ASCEND' ? '12px' : undefined }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {tab.icon}
                </span>
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme Toggle */}
        <div className="mt-auto pt-4 border-t border-outline-variant/20">
          <button
            onClick={toggleTheme}
            className={`w-full py-3 font-label text-[9px] uppercase tracking-widest font-bold transition-all press-scale border ${
              theme === 'FORGE'
                ? 'border-[#1e293b] text-[#64748b] hover:text-[#f59e0b] hover:border-[#f59e0b]/30'
                : 'border-white/[0.08] text-[#8b8fa4] hover:text-primary hover:border-primary/20 rounded-xl'
            }`}
          >
            Switch to {theme === 'FORGE' ? 'ASCEND' : 'FORGE'}
          </button>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col lg:ml-[260px] relative z-10 w-full min-h-screen">

        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center px-8 h-14 w-full fixed top-0 lg:w-[calc(100%-260px)] z-40 bg-background/60 backdrop-blur-xl border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary/60 text-sm animate-flame" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="font-label text-[10px] text-on-surface-variant tracking-widest uppercase">{profile.streak} day streak</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} title="Switch Path" className="p-2 text-on-surface-variant hover:text-primary transition-colors press-scale">
              <span className="material-symbols-outlined text-lg">swap_horiz</span>
            </button>
            <button onClick={toggleMode} title="Toggle Light/Dark Mode" className="p-2 text-on-surface-variant hover:text-primary transition-colors press-scale">
              <span className="material-symbols-outlined text-lg">{mode === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex justify-between items-center px-5 h-14 w-full fixed top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-outline-variant/10">
          <h1 className="font-display text-lg font-bold tracking-wider text-primary uppercase">
            {theme === 'FORGE' ? 'FORGE' : 'ASCEND'}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#f59e0b] text-sm animate-flame" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="font-display text-xs font-bold">{profile.streak}d</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={toggleTheme} title="Switch Path" className="p-1.5 text-on-surface-variant hover:text-primary press-scale">
                <span className="material-symbols-outlined text-base">swap_horiz</span>
              </button>
              <button onClick={toggleMode} title="Toggle Light/Dark Mode" className="p-1.5 text-on-surface-variant hover:text-primary press-scale">
                <span className="material-symbols-outlined text-base">{mode === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Bottom Nav */}
        <nav className={`lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 pb-safe border-t transition-all ${
          theme === 'FORGE'
            ? 'bg-surface/95 border-outline-variant backdrop-blur-sm'
            : 'bg-surface/85 backdrop-blur-xl border-outline-variant'
        }`}>
          {navItems.filter(t => t.id !== 'settings').map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 transition-all press-scale ${
                  active ? 'text-primary' : 'text-on-surface-variant/50'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-all ${active ? 'scale-110' : ''}`}
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                <span className="font-label text-[8px] mt-0.5 tracking-wider uppercase">{tab.label}</span>
                {active && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${
                    theme === 'FORGE' ? 'bg-[#f59e0b]' : 'bg-primary'
                  }`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* VIEW */}
        <main className="flex-1 p-5 pt-20 pb-28 lg:pt-20 lg:pb-10 max-w-7xl mx-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              className="w-full h-full"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ═══ LEVEL UP CINEMATIC ═══ */}
      <AnimatePresence>
        {justLeveledUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[120] flex items-center justify-center cinematic-backdrop"
            onClick={() => setJustLeveledUp(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
              className={`p-10 md:p-14 max-w-md w-full mx-4 text-center relative overflow-hidden border ${
                theme === 'FORGE'
                  ? 'bg-[#0a0c0e] border-[#f59e0b]/30 shadow-[0_0_60px_rgba(245,158,11,0.2)]'
                  : 'ascend-card border-primary/40 shadow-[0_0_80px_rgba(168,85,247,0.25)]'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {theme === 'ASCEND' && <div className="ascend-radial-halo" />}

              {/* Radial accent lines */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut", repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-[200px] h-[200px] rounded-full border border-primary/40" />
              </motion.div>

              <div className="relative z-10">
                <motion.span 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-label text-[10px] tracking-[0.4em] text-primary/80 uppercase block mb-6 font-bold"
                >
                  {theme === 'FORGE' ? 'SYSTEM EVOLUTION DETECTED' : 'ASCENSION CONFIRMED'}
                </motion.span>

                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.5 }}
                  className={`font-display text-[90px] md:text-[110px] font-black text-primary leading-none tracking-tighter mb-2 ${theme === 'FORGE' ? 'forge-glow' : 'ascend-glow'}`}
                >
                  {justLeveledUp.newLevel}
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="font-display text-2xl font-bold text-on-surface uppercase tracking-[0.2em] mb-1"
                >
                  LEVEL UP
                </motion.h2>

                <motion.div 
                  initial={{ opacity: 0, width: "0%" }}
                  animate={{ opacity: 1, width: "100%" }}
                  transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                  className="flex justify-center items-center gap-4 py-5 my-6 border-t border-b border-outline-variant/20 mx-auto overflow-hidden whitespace-nowrap"
                >
                  <div className="flex flex-col items-center">
                    <span className="font-label text-[8px] text-on-surface-variant tracking-widest">FROM</span>
                    <span className="font-display text-xl text-on-surface-variant/50 line-through">{justLeveledUp.oldLevel}</span>
                  </div>
                  <span className="material-symbols-outlined text-primary text-sm px-2">arrow_forward</span>
                  <div className="flex flex-col items-center">
                    <span className="font-label text-[8px] text-primary tracking-widest font-bold">NOW</span>
                    <span className={`font-display text-2xl text-primary font-black ${theme === 'FORGE' ? 'forge-glow' : 'ascend-glow'}`}>{justLeveledUp.newLevel}</span>
                  </div>
                </motion.div>

                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="font-label text-xs text-on-surface font-bold uppercase tracking-wider mb-8"
                >
                  Title: <span className="text-primary">{justLeveledUp.title}</span>
                </motion.p>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  onClick={() => setJustLeveledUp(null)}
                  className={`w-full bg-primary text-background font-label text-sm font-extrabold uppercase tracking-widest py-4 hover:opacity-90 transition-opacity press-scale`}
                  style={{ borderRadius: theme === 'FORGE' ? '0' : '12px' }}
                >
                  ACKNOWLEDGE
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ACHIEVEMENT TOAST ═══ */}
      {newAchievementUnlocked && (
        <div
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[100] max-w-sm w-full animate-slide-in cursor-pointer"
          onClick={() => setNewAchievementUnlocked(null)}
        >
          <div className={`p-4 flex gap-4 items-center border ${
            theme === 'FORGE'
              ? 'bg-[#0a0c0e] border-[#f59e0b]/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
              : 'ascend-card shadow-[0_0_30px_rgba(168,85,247,0.1)]'
          }`}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b45309] to-[#fbbf24] text-background flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl">{newAchievementUnlocked.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-label text-[7px] text-primary font-bold uppercase tracking-[0.2em] block mb-0.5">
                ACHIEVEMENT UNLOCKED
              </span>
              <h4 className="font-label text-sm font-bold text-on-surface truncate">{newAchievementUnlocked.name}</h4>
              <p className="font-body text-[10px] text-on-surface-variant/70 truncate">{newAchievementUnlocked.description}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setNewAchievementUnlocked(null); }}
              className="text-on-surface-variant/40 hover:text-on-surface flex-shrink-0"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
