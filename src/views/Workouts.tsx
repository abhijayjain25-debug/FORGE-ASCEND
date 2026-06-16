import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useAppTheme } from '../contexts/ThemeContext';

export const Workouts: React.FC = () => {
  const {
    activeWorkout,
    startWorkout,
    updateActiveWorkoutDuration,
    finishActiveWorkout,
    cancelActiveWorkout
  } = useApp();

  const { theme } = useAppTheme();

  // Selected template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('workout-1');
  const [customWorkoutName, setCustomWorkoutName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  // Active workout exercises state (local copy for easy checking and modifications)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [exercisesState, setExercisesState] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prevWorkout, setPrevWorkout] = useState<any>(null);

  if (activeWorkout !== prevWorkout) {
    setPrevWorkout(activeWorkout);
    setExercisesState(activeWorkout ? activeWorkout.exercises : []);
  }

  // Rest Timer state
  const [restTimeRemaining, setRestTimeRemaining] = useState<number>(0);
  const [maxRestTime, setMaxRestTime] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);



  // Active workout timer loop
  useEffect(() => {
    if (!activeWorkout || !activeWorkout.active) return;
    const interval = setInterval(() => {
      updateActiveWorkoutDuration(activeWorkout.duration + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout, updateActiveWorkoutDuration]);

  // Rest Timer loop
  useEffect(() => {
    if (!isTimerRunning || restTimeRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimeRemaining]);

  // Helper to format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStartTemplate = (template: any) => {
    startWorkout(template.name, template.exercises);
    // Auto reset rest timer
    setRestTimeRemaining(0);
    setIsTimerRunning(false);
  };

  const handleStartCustom = () => {
    if (!customWorkoutName) return;
    startWorkout(customWorkoutName, []);
    setCustomWorkoutName('');
    setShowCreateModal(false);
  };

  const handleToggleSetComplete = (exIndex: number, setIndex: number) => {
    const updated = [...exercisesState];
    const targetSet = updated[exIndex].sets[setIndex];
    targetSet.completed = !targetSet.completed;
    
    // Set details
    targetSet.exercise_name = updated[exIndex].name;
    
    setExercisesState(updated);

    // If set is completed, start the Rest Timer automatically!
    if (targetSet.completed) {
      setRestTimeRemaining(90);
      setMaxRestTime(90);
      setIsTimerRunning(true);
    }
  };

  const handleSetFieldChange = (exIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    const updated = [...exercisesState];
    updated[exIndex].sets[setIndex][field] = value;
    setExercisesState(updated);
  };

  const handleAddSet = (exIndex: number) => {
    const updated = [...exercisesState];
    const sets = updated[exIndex].sets;
    sets.push({
      set_number: sets.length + 1,
      weight: sets.length > 0 ? sets[sets.length - 1].weight : 0,
      reps: sets.length > 0 ? sets[sets.length - 1].reps : 10,
      completed: false
    });
    setExercisesState(updated);
  };

  const handleAddExercise = (name: string) => {
    if (!name.trim()) return;
    const updated = [...exercisesState];
    updated.push({
      name: name.trim(),
      category: 'Custom',
      sets: [
        { set_number: 1, weight: 0, reps: 10, completed: false }
      ]
    });
    setExercisesState(updated);
    setNewExerciseName('');
    setShowAddExerciseModal(false);
  };

  const handleFinish = async () => {
    // Gather all sets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allSets: any[] = [];
    exercisesState.forEach(ex => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ex.sets.forEach((set: any) => {
        allSets.push({
          exercise_name: ex.name,
          set_number: set.set_number,
          weight: Number(set.weight) || 0,
          reps: Number(set.reps) || 0,
          completed: set.completed
        });
      });
    });

    await finishActiveWorkout(allSets);
    setRestTimeRemaining(0);
    setIsTimerRunning(false);
  };

  // Rest Timer Circle Offset
  const restCircumference = 2 * Math.PI * 45;
  const restOffset = restTimeRemaining > 0 
    ? restCircumference - (restTimeRemaining / maxRestTime) * restCircumference
    : restCircumference;

  // Render Workout Template Selection
  const templates = [
    {
      id: 'workout-1',
      name: 'Upper Body',
      description: 'Heavy compound push and pull focus',
      exercises: [
        { name: 'Bench Press', category: 'Chest', target_sets: 4, target_reps: 8 },
        { name: 'Incline DB Press', category: 'Chest', target_sets: 3, target_reps: 10 },
        { name: 'Weighted Pull-ups', category: 'Back', target_sets: 4, target_reps: 6 },
        { name: 'Barbell Row', category: 'Back', target_sets: 3, target_reps: 10 },
      ]
    },
    {
      id: 'workout-2',
      name: 'Lower Body',
      description: 'Squat focus and posterior chain development',
      exercises: [
        { name: 'Barbell Squat', category: 'Quads', target_sets: 4, target_reps: 6 },
        { name: 'Romanian Deadlift', category: 'Hamstrings', target_sets: 4, target_reps: 8 },
        { name: 'Leg Press', category: 'Quads', target_sets: 3, target_reps: 12 },
        { name: 'Calf Raises', category: 'Calves', target_sets: 4, target_reps: 15 },
      ]
    }
  ];

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
      {/* 1. HEADER HERO */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6 relative ${
        theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/[0.06]'
      }`}>

        <motion.div variants={itemVariants}>
          <p className="font-label text-[10px] text-primary/60 tracking-[0.3em] uppercase mb-2">
            {activeWorkout ? 'CURRENT SESSION' : 'TRAINING PROTOCOL'}
          </p>
          <h1 className="font-display text-3xl md:text-4xl leading-none text-on-background uppercase tracking-tight font-bold">
            {activeWorkout ? activeWorkout.name : 'Log Workout'}
          </h1>
        </motion.div>

        {/* Global active session timer */}
        {activeWorkout && (
          <motion.div variants={itemVariants} className={`flex items-center gap-4 p-2 border ${
            theme === 'FORGE' ? 'bg-[#0a0c0e] border-[#1e293b]' : 'ascend-card'
          }`}>
            <div className="flex items-center gap-2 px-3">
              <span className="material-symbols-outlined text-primary/60">timer</span>
              <span className="font-display text-lg font-bold text-primary tracking-widest tabular-nums">
                {formatTime(activeWorkout.duration)}
              </span>
            </div>
            <div className={`h-8 w-[1px] ${theme === 'FORGE' ? 'bg-[#1e293b]' : 'bg-white/[0.08]'}`}></div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinish}
              className="bg-primary text-background font-label text-xs uppercase tracking-widest px-6 py-2.5 hover:opacity-90 transition-opacity"
              style={{ borderRadius: theme === 'FORGE' ? '0' : '10px' }}
            >
              FINISH
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={cancelActiveWorkout}
              className="text-on-surface-variant hover:text-error text-xs font-label uppercase tracking-widest px-2 transition-colors"
            >
              CANCEL
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* 2. BODY CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE WORKOUT OR TEMPLATE LIST */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeWorkout ? (
            // Active session set loggers
            exercisesState.map((ex, exIdx) => (
              <motion.article 
                variants={itemVariants}
                key={exIdx}
                className={`overflow-hidden relative group transition-all ${
                  theme === 'FORGE' 
                    ? 'forge-panel' 
                    : 'ascend-card'
                }`}
              >
                <header className={`p-6 pb-4 flex justify-between items-start border-b ${
                  theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/[0.06]'
                }`}>
                  <div>
                    <h2 className="font-headline text-xl text-on-surface mb-1 group-hover:text-primary transition-colors duration-300">
                      {ex.name}
                    </h2>
                    <p className="font-body text-xs text-on-surface-variant/80">
                      {ex.category}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-[2px] border ${
                    theme === 'FORGE' ? 'bg-surface-container-high border-outline-variant/50' : 'bg-surface/50 border-white/10'
                  }`}>
                    <span className="font-label text-[10px] text-tertiary">
                      TARGET: {ex.target_sets || ex.sets.length}x{ex.target_reps || 8}
                    </span>
                  </div>
                </header>

                <div className="p-6 flex flex-col gap-3">
                  {/* Set headers */}
                  <div className={`grid grid-cols-12 gap-2 font-label text-[10px] text-on-surface-variant/60 pb-2 border-b px-2 ${
                    theme === 'FORGE' ? 'border-outline-variant/20' : 'border-white/5'
                  }`}>
                    <div className="col-span-2 text-center">SET</div>
                    <div className="col-span-3 text-center">PREV</div>
                    <div className="col-span-3 text-center">KG</div>
                    <div className="col-span-2 text-center">REPS</div>
                    <div className="col-span-2 text-center">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                  </div>

                  {/* Set list */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {ex.sets.map((set: any, setIdx: number) => (
                    <div 
                      key={setIdx}
                      className={`grid grid-cols-12 gap-2 items-center p-2 rounded relative border transition-all ${
                        set.completed
                          ? 'bg-primary/5 border-transparent opacity-75'
                          : 'bg-surface-container border-transparent'
                      }`}
                    >
                      {set.completed && (
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary"></div>
                      )}
                      
                      <div className="col-span-2 text-center font-headline text-sm text-primary font-bold">
                        {set.set_number}
                      </div>
                      
                      <div className="col-span-3 text-center font-body text-xs text-on-surface-variant/50">
                        -
                      </div>
                      
                      <div className="col-span-3">
                        <input 
                          type="number"
                          value={set.weight || ''}
                          placeholder="0.0"
                          disabled={set.completed}
                          onChange={(e) => handleSetFieldChange(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                          className={`w-full bg-transparent border-b text-center font-body text-sm text-on-surface focus:border-primary focus:ring-0 px-0 py-1 transition-colors ${
                            theme === 'FORGE' ? 'border-outline-variant/30' : 'border-white/10'
                          }`}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <input 
                          type="number"
                          value={set.reps || ''}
                          placeholder="10"
                          disabled={set.completed}
                          onChange={(e) => handleSetFieldChange(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                          className={`w-full bg-transparent border-b text-center font-body text-sm text-on-surface focus:border-primary focus:ring-0 px-0 py-1 transition-colors ${
                            theme === 'FORGE' ? 'border-outline-variant/30' : 'border-white/10'
                          }`}
                        />
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <button 
                          onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                          className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${
                            set.completed
                              ? theme === 'FORGE'
                                ? 'bg-primary/20 text-primary border-primary/50'
                                : 'bg-primary/20 text-primary border-primary/50 hud-glow'
                              : 'bg-surface-container-highest text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-2 flex justify-center">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddSet(exIdx)}
                      className="text-primary font-label text-[10px] tracking-widest flex items-center gap-1 transition-opacity py-2 px-4 rounded border border-primary/10 hover:border-primary/30 hover:bg-primary/5"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span> ADD SET
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            // Session selection / template templates list
            <motion.div variants={itemVariants} className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h2 className="font-headline text-2xl text-on-surface uppercase tracking-wider font-bold">Select Program</h2>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded font-label text-xs uppercase tracking-widest hover:bg-primary/20 transition-all"
                >
                  Create Custom
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map(t => (
                  <div 
                    key={t.id}
                    className={`rounded-xl p-6 border flex flex-col justify-between transition-all ${
                      selectedTemplateId === t.id
                        ? theme === 'FORGE'
                          ? 'bg-[#1A1A1A] border-primary forge-shadow'
                          : 'hud-glass border-primary hud-glow'
                        : 'bg-surface-container/50 border-outline-variant/30 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplateId(t.id)}
                  >
                    <div>
                      <h3 className="font-headline text-xl text-on-surface font-semibold mb-2">{t.name}</h3>
                      <p className="font-body text-xs text-on-surface-variant/80 mb-6">{t.description}</p>
                      
                      <ul className="flex flex-col gap-2 mb-8">
                        {t.exercises.map((e, idx) => (
                          <li key={idx} className="flex justify-between text-xs font-body text-on-surface-variant">
                            <span>{e.name}</span>
                            <span className="font-label text-[10px] text-tertiary">{e.target_sets}x{e.target_reps}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStartTemplate(t)}
                      className="w-full bg-primary text-background font-label text-xs uppercase tracking-widest py-3 rounded font-bold hover:opacity-90 transition-opacity"
                    >
                      START PROTOCOL
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeWorkout && (
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddExerciseModal(true)}
              className={`w-full py-4 border-2 border-dashed font-label text-xs uppercase tracking-widest transition-all ${
                theme === 'FORGE' 
                  ? 'border-[#1e293b] hover:border-primary text-on-surface-variant hover:text-primary'
                  : 'border-white/[0.08] hover:border-primary text-on-surface-variant hover:text-primary rounded-xl'
              }`}
            >
              + ADD EXERCISE TO LOG
            </motion.button>
          )}
        </div>

        {/* RIGHT COLUMN: REST WIDGET & CHART */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          
          {/* REST TIMER CARD */}
          <motion.div 
            variants={itemVariants}
            className={`p-6 flex flex-col items-center justify-center relative overflow-hidden ${
              theme === 'FORGE' 
                ? 'forge-panel' 
                : 'ascend-card'
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
            
            <h3 className="font-label text-xs text-on-surface-variant mb-6 w-full text-left uppercase tracking-widest">
              REST TIMER
            </h3>
            
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              {/* Background Ring */}
              <svg className="absolute inset-0 w-full h-full forge-progress-ring" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke={theme === 'FORGE' ? '#222222' : '#222222'} strokeWidth="4"></circle>
              </svg>
              {/* Active Ring */}
              <svg className="absolute inset-0 w-full h-full forge-progress-ring" viewBox="0 0 100 100">
                <circle 
                  className="transition-all duration-1000 ease-linear" 
                  cx="50" 
                  cy="50" 
                  fill="none" 
                  r="45" 
                  stroke={theme === 'FORGE' ? 'url(#forgeGlowCircle)' : 'url(#ascendGlowCircle)'}
                  strokeDasharray={restCircumference} 
                  strokeDashoffset={restOffset} 
                  strokeLinecap="round" 
                  strokeWidth="4"
                ></circle>
                <defs>
                  <linearGradient id="forgeGlowCircle" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#d97706"></stop>
                    <stop offset="100%" stopColor="#f59e0b"></stop>
                  </linearGradient>
                  <linearGradient id="ascendGlowCircle" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7"></stop>
                    <stop offset="100%" stopColor="#06b6d4"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex flex-col items-center relative z-10">
                <span className="font-headline text-4xl font-light text-on-surface leading-none tabular-nums tracking-tighter">
                  {formatTime(restTimeRemaining)}
                </span>
              </div>
            </div>

            <div className="flex gap-4 w-full relative z-10">
              <button 
                onClick={() => {
                  setRestTimeRemaining(prev => prev + 30);
                  setMaxRestTime(max => Math.max(90, max + 30));
                  setIsTimerRunning(true);
                }}
                className="flex-1 border border-outline-variant text-on-surface-variant font-label text-[10px] uppercase tracking-widest py-2 rounded hover:bg-surface-variant/30 transition-colors"
              >
                +30s
              </button>
              <button 
                onClick={() => {
                  setRestTimeRemaining(0);
                  setIsTimerRunning(false);
                }}
                className="flex-1 bg-surface-variant text-on-surface font-label text-[10px] uppercase tracking-widest py-2 rounded hover:bg-surface-container-high transition-colors"
              >
                SKIP
              </button>
            </div>
          </motion.div>

          {/* STRENGTH PROGRESSION CHART */}
          <motion.div 
            variants={itemVariants}
            className={`p-6 relative ${
              theme === 'FORGE' 
                ? 'forge-panel' 
                : 'ascend-card'
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-label text-xs text-on-surface-variant uppercase tracking-widest">
                STRENGTH PROGRESSION
              </h3>
              <span className="material-symbols-outlined text-on-surface-variant/50 text-sm">trending_up</span>
            </div>

            <div className="relative h-48 w-full bg-[#111111] rounded border border-outline-variant/20 chart-grid overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                {/* Deadlift Line (mock progression) */}
                <path className="opacity-30" d="M 0,80 Q 20,75 40,60 T 80,40 T 100,28" fill="none" stroke="var(--color-outline)" strokeWidth="1"></path>
                {/* Squat Line (mock progression) */}
                <path className="opacity-50" d="M 0,70 Q 25,65 50,55 T 75,45 T 100,34" fill="none" stroke="var(--color-outline-variant)" strokeWidth="1"></path>
                
                {/* Bench Line (active focus) */}
                <path 
                  className={theme === 'FORGE' ? 'drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]'}
                  d="M 0,90 Q 30,85 50,70 T 80,60 T 100,48" 
                  fill="none" 
                  stroke="var(--color-primary)" 
                  strokeWidth="2.5"
                ></path>
                
                {/* Data Nodes */}
                <circle cx="50" cy="70" fill="#111111" r="2.5" stroke="var(--color-primary)" strokeWidth="1.5"></circle>
                <circle cx="80" cy="60" fill="#111111" r="2.5" stroke="var(--color-primary)" strokeWidth="1.5"></circle>
                <circle cx="100" cy="48" fill="var(--color-tertiary)" r="3.5"></circle>
              </svg>
              
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-[2px] bg-primary"></div>
                  <span className="font-label text-[8px] text-on-surface-variant/80 tracking-widest uppercase">BENCH</span>
                </div>
              </div>
            </div>
          </motion.div>
        </aside>
      </div>

      {/* CREATE CUSTOM WORKOUT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center cinematic-backdrop" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0, y: -10 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`p-6 w-full max-w-sm mx-4 border ${theme === 'FORGE' ? 'bg-[#0a0c0e] border-[#1e293b]' : 'ascend-card'}`} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-sm font-bold text-primary uppercase tracking-widest mb-5">New Training Template</h3>
            <input 
              type="text"
              placeholder="Name e.g. Pull Workout"
              value={customWorkoutName}
              onChange={(e) => setCustomWorkoutName(e.target.value)}
              className={`w-full p-3 bg-background border mb-5 text-on-surface text-sm focus:outline-none focus:border-primary transition-colors ${theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/10 rounded-lg'}`}
            />
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleStartCustom} className="flex-1 bg-primary text-background font-label text-xs uppercase tracking-widest py-3 font-bold transition-opacity" style={{ borderRadius: theme === 'FORGE' ? '0' : '10px' }}>CREATE & START</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreateModal(false)} className="flex-1 border border-outline text-on-surface-variant font-label text-xs uppercase tracking-widest py-3 hover:bg-white/5 transition-colors" style={{ borderRadius: theme === 'FORGE' ? '0' : '10px' }}>CANCEL</motion.button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD EXERCISE MODAL */}
      <AnimatePresence>
        {showAddExerciseModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center cinematic-backdrop" onClick={() => setShowAddExerciseModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0, y: -10 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`p-6 w-full max-w-xs mx-4 border ${theme === 'FORGE' ? 'bg-[#0a0c0e] border-[#1e293b]' : 'ascend-card'}`} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-sm font-bold text-primary uppercase tracking-widest mb-5">Add Exercise</h3>
            <input 
              type="text"
              placeholder="e.g. Lateral Raises"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              className={`w-full p-3 bg-background border mb-5 text-on-surface text-sm focus:outline-none focus:border-primary transition-colors ${theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/10 rounded-lg'}`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddExercise(newExerciseName)}
            />
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => handleAddExercise(newExerciseName)} className="flex-1 bg-primary text-background font-label text-xs uppercase tracking-widest py-3 font-bold transition-opacity" style={{ borderRadius: theme === 'FORGE' ? '0' : '10px' }}>ADD</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={() => { setShowAddExerciseModal(false); setNewExerciseName(''); }} className="flex-1 border border-outline text-on-surface-variant font-label text-xs uppercase tracking-widest py-3 hover:bg-white/5 transition-colors" style={{ borderRadius: theme === 'FORGE' ? '0' : '10px' }}>CANCEL</motion.button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
