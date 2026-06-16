import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/db';
import { useAppTheme } from '../contexts/ThemeContext';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { theme } = useAppTheme();
  const [step, setStep] = useState(1);
  
  // Answers state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [workoutPreference, setWorkoutPreference] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 8;

  const handleNext = () => {
    // Basic validation
    if (step === 1 && !name.trim()) return;
    if (step === 2 && (!age || parseInt(age) <= 0)) return;
    if (step === 3 && !mainGoal) return;
    if (step === 4 && (!height || parseFloat(height) <= 0)) return;
    if (step === 5 && (!weight || parseFloat(weight) <= 0)) return;
    if (step === 6 && !activityLevel) return;
    if (step === 7 && !workoutPreference) return;
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      const weightNum = parseFloat(weight) || 70;
      
      // 1. Log initial weight
      await db.saveWeightLog(weightNum);

      // 2. Update user profile details
      await db.updateProfile({
        name,
        age: parseInt(age) || 25,
        height: parseFloat(height) || 175,
        current_weight: weightNum,
        goal_weight: parseFloat(goalWeightFallback(mainGoal, weightNum)),
        main_goal: mainGoal,
        activity_level: activityLevel,
        workout_preference: workoutPreference,
        experience_level: experienceLevel,
        is_onboarded: true,
        xp: 0,
        level: 0,
        streak: 0,
        max_streak: 0
      });

      onComplete();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError('Failed to configure profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goalWeightFallback = (goal: string, current: number): string => {
    if (goal.toLowerCase().includes('loss')) return (current - 5).toString();
    if (goal.toLowerCase().includes('gain')) return (current + 5).toString();
    return current.toString();
  };

  // Render question bodies
  const renderQuestion = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
              {theme === 'FORGE' ? 'Identify Operator Code' : 'What is your name?'}
            </h2>
            <p className="font-body text-xs text-on-surface-variant">
              {theme === 'FORGE' ? 'Input name identifier for the database.' : 'Let us know how to address you.'}
            </p>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`p-3 bg-background border focus:outline-none focus:ring-0 ${
                theme === 'FORGE' 
                  ? 'border-outline-variant/30 text-on-surface focus:border-primary rounded-none' 
                  : 'border-white/10 text-on-surface focus:border-primary rounded-lg'
              }`}
              placeholder="e.g. Marcus"
            />
          </>
        );
      case 2:
        return (
          <>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
              {theme === 'FORGE' ? 'Vessel Lifespan (Age)' : 'How old are you?'}
            </h2>
            <p className="font-body text-xs text-on-surface-variant">
              Used to configure baseline physical scaling variables.
            </p>
            <input
              type="number"
              required
              autoFocus
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={`p-3 bg-background border focus:outline-none focus:ring-0 ${
                theme === 'FORGE' 
                  ? 'border-outline-variant/30 text-on-surface focus:border-primary rounded-none' 
                  : 'border-white/10 text-on-surface focus:border-primary rounded-lg'
              }`}
              placeholder="e.g. 32"
            />
          </>
        );
      case 3:
        return (
          <>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
              {theme === 'FORGE' ? 'Select Primary Directive' : 'Choose your primary goal'}
            </h2>
            <p className="font-body text-xs text-on-surface-variant">
              This shapes your attributes progression priorities.
            </p>
            <div className="flex flex-col gap-2">
              {[
                'Weight Loss / Shredding',
                'Strength Gain / Bulking',
                'Discipline & Consistency',
                'Full Body Athleticism'
              ].map(opt => {
                const isSelected = mainGoal === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMainGoal(opt)}
                    className={`p-4 text-left border transition-all text-xs font-label uppercase tracking-widest ${
                      isSelected
                        ? (theme === 'FORGE' ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-primary/20 border-primary text-primary font-bold')
                        : 'bg-background hover:bg-surface-variant/20 border-outline-variant/30 text-on-surface-variant'
                    } ${theme === 'FORGE' ? 'rounded-none' : 'rounded-lg'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        );
      case 4:
        return (
          <>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
              {theme === 'FORGE' ? 'Height Measurement' : 'What is your height?'}
            </h2>
            <p className="font-body text-xs text-on-surface-variant">
              Configure baseline height in centimeters (cm).
            </p>
            <input
              type="number"
              required
              autoFocus
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className={`p-3 bg-background border focus:outline-none focus:ring-0 ${
                theme === 'FORGE' 
                  ? 'border-outline-variant/30 text-on-surface focus:border-primary rounded-none' 
                  : 'border-white/10 text-on-surface focus:border-primary rounded-lg'
              }`}
              placeholder="e.g. 180"
            />
          </>
        );
      case 5:
        return (
          <>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
              {theme === 'FORGE' ? 'Vessel Mass (Weight)' : 'What is your current weight?'}
            </h2>
            <p className="font-body text-xs text-on-surface-variant">
              Initial weight input in kilograms (kg).
            </p>
            <input
              type="number"
              step="0.1"
              required
              autoFocus
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`p-3 bg-background border focus:outline-none focus:ring-0 ${
                theme === 'FORGE' 
                  ? 'border-outline-variant/30 text-on-surface focus:border-primary rounded-none' 
                  : 'border-white/10 text-on-surface focus:border-primary rounded-lg'
              }`}
              placeholder="e.g. 85.4"
            />
          </>
        );
      case 6:
        return (
          <>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
              {theme === 'FORGE' ? 'Energy Output Level' : 'Select your activity level'}
            </h2>
            <p className="font-body text-xs text-on-surface-variant">
              How active is your daily lifestyle?
            </p>
            <div className="flex flex-col gap-2">
              {[
                'Sedentary (Office / Minimal movement)',
                'Moderately Active (Daily walks / Casual exercise)',
                'Highly Active (Heavy training / Physical job)'
              ].map(opt => {
                const isSelected = activityLevel === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setActivityLevel(opt)}
                    className={`p-4 text-left border transition-all text-xs font-label uppercase tracking-widest ${
                      isSelected
                        ? (theme === 'FORGE' ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-primary/20 border-primary text-primary font-bold')
                        : 'bg-background hover:bg-surface-variant/20 border-outline-variant/30 text-on-surface-variant'
                    } ${theme === 'FORGE' ? 'rounded-none' : 'rounded-lg'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        );
      case 7:
        return (
          <>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
              {theme === 'FORGE' ? 'Preferred Training Discipline' : 'What is your training style?'}
            </h2>
            <p className="font-body text-xs text-on-surface-variant">
              What type of training fits your style?
            </p>
            <div className="flex flex-col gap-2">
              {[
                'Strength / Weightlifting focus',
                'Cardio / Endurance runs',
                'Calisthenics / Bodyweight',
                'Hybrid / General fitness'
              ].map(opt => {
                const isSelected = workoutPreference === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWorkoutPreference(opt)}
                    className={`p-4 text-left border transition-all text-xs font-label uppercase tracking-widest ${
                      isSelected
                        ? (theme === 'FORGE' ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-primary/20 border-primary text-primary font-bold')
                        : 'bg-background hover:bg-surface-variant/20 border-outline-variant/30 text-on-surface-variant'
                    } ${theme === 'FORGE' ? 'rounded-none' : 'rounded-lg'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        );
      case 8:
        return (
          <>
            <h2 className="font-headline text-2xl md:text-3xl font-extrabold uppercase tracking-wide">
              {theme === 'FORGE' ? 'Combat Experience Level' : 'Select fitness experience'}
            </h2>
            <p className="font-body text-xs text-on-surface-variant">
              Select your background knowledge level.
            </p>
            <div className="flex flex-col gap-2">
              {[
                'Beginner (Starting fresh / learning forms)',
                'Intermediate (Consistent lifts / understand split)',
                'Advanced (Heavy compound PRs / high endurance)'
              ].map(opt => {
                const isSelected = experienceLevel === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setExperienceLevel(opt)}
                    className={`p-4 text-left border transition-all text-xs font-label uppercase tracking-widest ${
                      isSelected
                        ? (theme === 'FORGE' ? 'bg-primary/10 border-primary text-primary font-bold' : 'bg-primary/20 border-primary text-primary font-bold')
                        : 'bg-background hover:bg-surface-variant/20 border-outline-variant/30 text-on-surface-variant'
                    } ${theme === 'FORGE' ? 'rounded-none' : 'rounded-lg'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && !name.trim()) return true;
    if (step === 2 && (!age || parseInt(age) <= 0)) return true;
    if (step === 3 && !mainGoal) return true;
    if (step === 4 && (!height || parseFloat(height) <= 0)) return true;
    if (step === 5 && (!weight || parseFloat(weight) <= 0)) return true;
    if (step === 6 && !activityLevel) return true;
    if (step === 7 && !workoutPreference) return true;
    if (step === 8 && !experienceLevel) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-20 w-full max-w-lg mx-auto">
      <div 
        className={`w-full p-8 border transition-all duration-500 flex flex-col gap-6 ${
          theme === 'FORGE' 
            ? 'bg-[#0e1011] border-[#1e293b] rounded-none forge-card-glow text-[#f1f5f9]' 
            : 'ascend-floating-card ascend-card-glow text-[#f8fafc]'
        }`}
      >
        {/* PROGRESS BAR */}
        <div className="w-full flex justify-between items-center text-[9px] font-label uppercase tracking-widest opacity-60">
          <span>STEP {step} OF {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full h-1 bg-surface-container-high relative overflow-hidden">
          <div 
            className="h-full progress-gradient transition-all duration-500" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {error && (
          <div className="p-3 text-xs font-label uppercase tracking-widest text-red-400 bg-red-950/20 border border-red-500/20 rounded">
            {error}
          </div>
        )}

        {/* QUESTION WRAPPER */}
        <div className="min-h-[220px] flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col gap-4"
            >
              {renderQuestion()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* BUTTON ACTION NAV */}
        <div className="flex justify-between items-center gap-4 mt-6 pt-6 border-t border-outline-variant/20">
          <button
            type="button"
            disabled={step === 1 || loading}
            onClick={handleBack}
            className={`px-6 py-3 border font-label text-xs uppercase tracking-widest transition-colors font-bold ${
              step === 1 
                ? 'opacity-30 cursor-not-allowed border-outline-variant/30 text-on-surface-variant' 
                : 'border-outline-variant/40 hover:bg-surface-variant/20 text-on-surface-variant hover:text-on-surface'
            } ${theme === 'FORGE' ? 'rounded-none' : 'rounded-lg'}`}
          >
            BACK
          </button>

          <button
            type="button"
            disabled={isNextDisabled() || loading}
            onClick={handleNext}
            className={`px-8 py-3 bg-primary text-background font-label text-xs uppercase tracking-widest font-extrabold hover:opacity-90 transition-opacity disabled:opacity-45 disabled:cursor-not-allowed`}
            style={theme === 'FORGE' ? { borderRadius: '0px' } : { borderRadius: '8px' }}
          >
            {loading ? 'STORING...' : step === totalSteps ? 'INITIALIZE' : 'NEXT'}
          </button>
        </div>
      </div>
    </div>
  );
};
