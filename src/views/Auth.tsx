import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/db';
import { useAppTheme } from '../contexts/ThemeContext';

interface AuthProps {
  onAuthSuccess: () => void;
  onEnterSandbox: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onEnterSandbox }) => {
  const { theme } = useAppTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [dietType, setDietType] = useState('General');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        // Sign up user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Provision the initial profile row directly
          const profileData = {
            id: data.user.id,
            name: name || email.split('@')[0],
            age: parseInt(age) || 25,
            height: parseFloat(height) || 175,
            current_weight: parseFloat(weight) || 75,
            goal_weight: parseFloat(goalWeight) || 70,
            diet_type: dietType,
            theme: theme,
            xp: 0,
            level: 0,
            streak: 0,
            max_streak: 0,
          };

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData);

          if (profileError) {
            console.error("Failed to provision profile: ", profileError);
          }

          // Insert weight log if weight entered
          if (weight) {
            const { error: weightError } = await supabase
              .from('weight_logs')
              .insert({
                profile_id: data.user.id,
                log_date: new Date().toISOString().split('T')[0],
                weight: parseFloat(weight),
              });
            if (weightError) console.error("Failed to save initial weight log: ", weightError);
          }

          setMessage('Registration successful! Please check your email for verification or log in.');
          setIsSignUp(false);
        }
      } else {
        // Sign in user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        onAuthSuccess();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
      <div 
        className={`w-full max-w-md p-8 rounded-xl border transition-all duration-500 ${
          theme === 'FORGE' 
            ? 'bg-[#1e1a17] border-[#c96a28]/40 forge-shadow text-[#fcfaf7]' 
            : 'hud-glass border-[#8ed5ff]/30 hud-glow-intense text-[#eef7ff]'
        }`}
      >
        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-primary uppercase select-none">
            {theme === 'FORGE' ? 'FORGE PATH' : 'ASCEND PATH'}
          </h1>
          <p className="font-label text-[9px] text-on-surface-variant tracking-[0.2em] uppercase font-bold mt-1">
            {theme === 'FORGE' ? 'I am forging myself into someone stronger.' : 'I am becoming the best version of myself.'}
          </p>
        </div>

        {/* ERROR / SUCCESS FEEDBACK */}
        {error && (
          <div className="p-3 text-xs font-label uppercase tracking-widest text-red-400 bg-red-950/20 border border-red-500/20 rounded mb-4">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 text-xs font-label uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`p-3 rounded text-sm bg-background border focus:outline-none transition-colors ${
                theme === 'FORGE' 
                  ? 'border-outline-variant/30 text-on-surface focus:border-primary' 
                  : 'border-white/10 text-on-surface focus:border-primary'
              }`}
              placeholder="e.g. marcus@aurelius.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`p-3 rounded text-sm bg-background border focus:outline-none transition-colors ${
                theme === 'FORGE' 
                  ? 'border-outline-variant/30 text-on-surface focus:border-primary' 
                  : 'border-white/10 text-on-surface focus:border-primary'
              }`}
              placeholder="••••••••"
            />
          </div>

          {/* SIGN UP FIELDS */}
          <AnimatePresence>
            {isSignUp && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex flex-col gap-4 mt-2 pt-4 border-t border-outline-variant/20 overflow-hidden"
              >
                <h3 className="font-headline text-xs text-primary uppercase tracking-widest font-bold">Configure Vessel Details</h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Player Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`p-3 rounded text-sm bg-background border focus:outline-none ${
                    theme === 'FORGE' ? 'border-outline-variant/30 text-on-surface' : 'border-white/10 text-on-surface'
                  }`}
                  placeholder="e.g. Marcus"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Age</label>
                  <input 
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={`p-3 rounded text-sm bg-background border focus:outline-none ${
                      theme === 'FORGE' ? 'border-outline-variant/30 text-on-surface' : 'border-white/10 text-on-surface'
                    }`}
                    placeholder="32"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Height (cm)</label>
                  <input 
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className={`p-3 rounded text-sm bg-background border focus:outline-none ${
                      theme === 'FORGE' ? 'border-outline-variant/30 text-on-surface' : 'border-white/10 text-on-surface'
                    }`}
                    placeholder="180"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Weight (kg)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className={`p-3 rounded text-sm bg-background border focus:outline-none ${
                      theme === 'FORGE' ? 'border-outline-variant/30 text-on-surface' : 'border-white/10 text-on-surface'
                    }`}
                    placeholder="85.4"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Target Weight (kg)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                    className={`p-3 rounded text-sm bg-background border focus:outline-none ${
                      theme === 'FORGE' ? 'border-outline-variant/30 text-on-surface' : 'border-white/10 text-on-surface'
                    }`}
                    placeholder="80.0"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Diet Style</label>
                <input 
                  type="text"
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  className={`p-3 rounded text-sm bg-background border focus:outline-none ${
                    theme === 'FORGE' ? 'border-outline-variant/30 text-on-surface' : 'border-white/10 text-on-surface'
                  }`}
                  placeholder="e.g. High Protein Keto"
                />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-primary text-background font-label text-xs font-bold uppercase tracking-widest py-3 rounded hover:opacity-90 transition-opacity"
          >
            {loading ? 'Processing System...' : isSignUp ? 'CREATE ACCOUNT' : 'INITIALIZE SESSION'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3 mt-6 pt-6 border-t border-outline-variant/20">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors font-bold"
          >
            {isSignUp ? 'Already registered? Sign In' : "New operator? Create Account"}
          </button>
          
          <button 
            onClick={onEnterSandbox}
            className="text-xs font-label uppercase tracking-widest text-primary/70 hover:text-primary transition-colors border-b border-primary/20 pb-0.5 mt-2"
          >
            Enter Local Sandbox Mode (Offline)
          </button>
        </div>
      </div>
    </div>
  );
};
