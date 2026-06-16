import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { db, supabase } from '../services/db';

export const Settings: React.FC = () => {
  const { profile } = useApp();
  if (!profile) return null;
  return <SettingsContent profile={profile} />;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SettingsContent: React.FC<{ profile: any }> = ({ profile }) => {
  const { 
    refreshData, 
    logWeight, 
    authMode, 
    setAuthMode, 
    signOut, 
    isAuthenticated 
  } = useApp();
  const { theme, setTheme, mode, setMode } = useAppTheme();

  // Local state for profile form initialized directly from props
  const [name, setName] = useState(profile.name || '');
  const [age, setAge] = useState(profile.age ? profile.age.toString() : '');
  const [height, setHeight] = useState(profile.height ? profile.height.toString() : '');
  const [currentWeight, setCurrentWeight] = useState(profile.current_weight ? profile.current_weight.toString() : '');
  const [goalWeight, setGoalWeight] = useState(profile.goal_weight ? profile.goal_weight.toString() : '');
  const [dietType, setDietType] = useState(profile.diet_type || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showCredsError, setShowCredsError] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setMessage('');
    
    try {
      const weightNum = parseFloat(currentWeight) || profile.current_weight;
      
      // Update weight logs if weight changes
      if (weightNum !== profile.current_weight) {
        await logWeight(weightNum);
      }

      await db.updateProfile({
        name,
        age: parseInt(age) || 0,
        height: parseFloat(height) || 0,
        current_weight: weightNum,
        goal_weight: parseFloat(goalWeight) || profile.goal_weight,
        diet_type: dietType
      });

      await refreshData();
      setMessage('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: 'FORGE' | 'ASCEND') => {
    setTheme(newTheme);
    if (profile) {
      try {
        await db.updateProfile({ theme: newTheme });
        await refreshData();
      } catch (err) {
        console.error("Failed to save theme setting:", err);
      }
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
      exit="hidden"
      className="flex flex-col gap-8 relative"
    >
      {/* 1. HEADER */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6 relative ${
        theme === 'FORGE' ? 'border-outline-variant/30' : 'border-white/10'
      }`}>
        {theme === 'FORGE' && (
          <div className="absolute bottom-0 left-0 w-1/4 h-[1px] bg-primary glow-line"></div>
        )}
        <motion.div variants={itemVariants}>
          <p className="font-label text-xs text-primary/70 mb-2 uppercase tracking-widest">
            {theme === 'FORGE' ? 'MASTER CONTROL' : 'SYSTEM SETTINGS'}
          </p>
          <h1 className="font-headline text-4xl md:text-5xl leading-none text-on-background uppercase tracking-tight font-black">
            Settings
          </h1>
        </motion.div>
      </div>

      {/* 2. THEME SWITCHER */}
      <motion.section variants={itemVariants} className={`p-6 flex flex-col gap-6 ${
        theme === 'FORGE' ? 'bg-surface-container-low forge-shadow card-rim' : 'hud-glass'
      }`}>
        <div className="flex flex-col gap-4 border-b border-outline-variant/20 pb-6">
          <h3 className="font-headline text-lg text-on-surface uppercase tracking-wider font-semibold">
            Color Mode
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('dark')}
              className={`py-3 px-4 border text-center font-label text-xs uppercase tracking-widest transition-all ${
                mode === 'dark'
                  ? (theme === 'FORGE' ? 'bg-primary text-background font-extrabold border-primary' : 'bg-primary text-background font-bold border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]')
                  : 'bg-background hover:bg-surface-variant/20 border-outline-variant text-on-surface-variant'
              } ${theme === 'FORGE' ? 'rounded-none' : 'rounded-lg'}`}
            >
              Dark Mode
            </button>
            <button
              type="button"
              onClick={() => setMode('light')}
              className={`py-3 px-4 border text-center font-label text-xs uppercase tracking-widest transition-all ${
                mode === 'light'
                  ? (theme === 'FORGE' ? 'bg-primary text-background font-extrabold border-primary' : 'bg-primary text-background font-bold border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)]')
                  : 'bg-background hover:bg-surface-variant/20 border-outline-variant text-on-surface-variant'
              } ${theme === 'FORGE' ? 'rounded-none' : 'rounded-lg'}`}
            >
              Light Mode
            </button>
          </div>
        </div>

        <h3 className="font-headline text-lg text-on-surface uppercase tracking-wider font-semibold">
          Select Path (Theme)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FORGE PATH */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleThemeChange('FORGE')}
            className={`p-6 rounded-none text-left border transition-all flex flex-col justify-between relative overflow-hidden group ${
              theme === 'FORGE'
                ? 'bg-surface border-primary forge-card-glow'
                : 'bg-surface-container/30 border-outline-variant/30 hover:border-primary/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4 font-headline">
                <h4 className="font-headline text-xl text-primary font-black tracking-widest uppercase">FORGE</h4>
                {theme === 'FORGE' && <span className="material-symbols-outlined text-[#f59e0b]">check_circle</span>}
              </div>
              <p className="font-body text-xs text-on-surface-variant/90 mb-4">
                Tactical dark metallic styling. Obsidian gray paneling, sharp borders, amber indicators, and clean grids. Inspired by Iron Man HUD and military operators.
              </p>
            </div>
            <div className="flex justify-between items-center mt-2 pt-4 border-t border-outline-variant/20 w-full font-label text-[10px] uppercase text-primary/80 tracking-widest font-bold">
              <span>PATH: ELITE OPERATOR</span>
              <span>"I am forging myself."</span>
            </div>
          </motion.button>

          {/* ASCEND PATH */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => handleThemeChange('ASCEND')}
            className={`p-6 rounded-xl text-left border transition-all flex flex-col justify-between relative overflow-hidden group ${
              theme === 'ASCEND'
                ? 'bg-surface-container-low border-primary ascend-card-glow'
                : 'bg-surface-container/30 border-outline-variant/30 hover:border-primary/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4 font-headline">
                <h4 className="font-headline text-xl text-primary font-bold tracking-widest uppercase">ASCEND</h4>
                {theme === 'ASCEND' && <span className="material-symbols-outlined text-primary">check_circle</span>}
              </div>
              <p className="font-body text-xs text-on-surface-variant/90 mb-4">
                Elegant minimal sci-fi styling. Deep midnight space purple, floating cards with soft gradients, silver labels, cyan highlights, and a slowly drifting cosmic nebula background.
              </p>
            </div>
            <div className="flex justify-between items-center mt-2 pt-4 border-t border-white/5 w-full font-label text-[10px] uppercase text-primary/80 tracking-widest font-bold">
              <span>PATH: SELF TRANSFORMATION</span>
              <span>"I am becoming more."</span>
            </div>
          </motion.button>
        </div>
      </motion.section>

      {/* DATABASE SYNC STATUS & AUTHENTICATION */}
      <motion.section variants={itemVariants} className={`p-6 flex flex-col gap-6 ${
        theme === 'FORGE' ? 'bg-surface-container-low forge-shadow card-rim' : 'hud-glass'
      }`}>
        <h3 className="font-headline text-lg text-on-surface uppercase tracking-wider font-semibold">
          Database Connection
        </h3>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 rounded-lg bg-background/50 border border-outline-variant/20">
          <div className="flex items-center gap-4">
            <span className={`w-3.5 h-3.5 rounded-full ${
              authMode === 'supabase' && isAuthenticated ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
            }`}></span>
            <div>
              <h4 className="font-headline text-sm font-bold text-on-surface uppercase tracking-wider">
                {authMode === 'supabase' && isAuthenticated ? 'Synced to Supabase Cloud' : 'Offline Sandbox Mode'}
              </h4>
              <p className="font-body text-xs text-on-surface-variant">
                {authMode === 'supabase' && isAuthenticated 
                  ? 'Your data is securely locked to your cloud account.' 
                  : 'Your logs are currently isolated inside this local browser.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {authMode === 'supabase' && isAuthenticated ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => signOut()}
                className="px-5 py-2.5 bg-red-950/20 border border-red-500/30 text-red-400 font-label text-xs uppercase tracking-widest hover:bg-red-500/10 rounded transition-colors font-bold"
              >
                SIGN OUT SESSION
              </motion.button>
            ) : (
              <div className="flex flex-wrap gap-3">
                {authMode === 'local' && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to reset all local sandbox data? This will delete all your offline progress, workouts, and logs.")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-5 py-2.5 bg-red-950/20 border border-red-500/30 text-red-400 font-label text-xs uppercase tracking-widest hover:bg-red-500/10 rounded transition-colors font-bold"
                  >
                    RESET SANDBOX DATA
                  </motion.button>
                )}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (!supabase) {
                      setShowCredsError(true);
                    } else {
                      setAuthMode('supabase');
                    }
                  }}
                  className="px-5 py-2.5 bg-primary text-background font-label text-xs uppercase tracking-widest hover:opacity-95 rounded transition-opacity font-bold"
                >
                  CONNECT CLOUD SYNC
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.section>


      {/* 3. PROFILE EDITOR */}
      <motion.section variants={itemVariants} className={`p-6 flex flex-col gap-6 ${
        theme === 'FORGE' ? 'bg-surface-container-low forge-shadow card-rim' : 'hud-glass'
      }`}>
        <h3 className="font-headline text-lg text-on-surface uppercase tracking-wider font-semibold">
          Profile Attributes
        </h3>

        {message && (
          <div className="p-3 text-xs font-label uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Name</label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 bg-background border border-outline-variant/40 rounded text-on-surface focus:border-primary focus:ring-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Age</label>
            <input 
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="p-3 bg-background border border-outline-variant/40 rounded text-on-surface focus:border-primary focus:ring-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Height (cm)</label>
            <input 
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="p-3 bg-background border border-outline-variant/40 rounded text-on-surface focus:border-primary focus:ring-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Diet Style</label>
            <input 
              type="text"
              value={dietType}
              onChange={(e) => setDietType(e.target.value)}
              className="p-3 bg-background border border-outline-variant/40 rounded text-on-surface focus:border-primary focus:ring-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Current Weight (kg)</label>
            <input 
              type="number"
              step="0.1"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              className="p-3 bg-background border border-outline-variant/40 rounded text-on-surface focus:border-primary focus:ring-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Target Weight (kg)</label>
            <input 
              type="number"
              step="0.1"
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              className="p-3 bg-background border border-outline-variant/40 rounded text-on-surface focus:border-primary focus:ring-0"
            />
          </div>

          <div className="col-span-1 md:col-span-2 mt-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto px-8 py-3 bg-primary text-background font-label text-xs font-bold uppercase tracking-widest rounded transition-opacity"
            >
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </motion.button>
          </div>
        </form>
      </motion.section>

      {/* 4. CREDENTIALS ERROR MODAL */}
      <AnimatePresence>
        {showCredsError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCredsError(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`p-6 rounded-xl border max-w-sm w-full mx-4 text-center ${
                theme === 'FORGE' 
                  ? 'bg-surface-container border-primary forge-shadow' 
                  : 'hud-glass border-primary hud-glow-intense'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="font-headline text-lg font-bold text-primary mb-2 uppercase tracking-widest">
              Configuration Missing
            </h2>
            <p className="font-body text-xs text-on-surface-variant/90 leading-relaxed mb-6">
              Supabase project credentials (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) are not configured or contain placeholder values in your `.env` file.
            </p>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCredsError(false)}
              className="w-full bg-primary text-background font-label text-xs font-bold uppercase tracking-widest py-3 rounded transition-opacity"
            >
              ACKNOWLEDGE
            </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
