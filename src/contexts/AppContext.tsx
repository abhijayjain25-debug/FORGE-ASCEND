import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, supabase } from '../services/db';
import type { UserProfile, WorkoutSession, NutritionLog, WeightLog, Achievement, ProgressPhotos } from '../services/db';
import { getLevelInfo, calculatePlayerAttributes } from '../utils/gameEngine';
import type { PlayerAttributes } from '../utils/gameEngine';

export interface DailyQuest {
  id: string;
  name: string;
  category: 'workout' | 'protein' | 'water' | 'steps' | 'sleep';
  current: number;
  target: number;
  unit: string;
  xpReward: number;
  completed: boolean;
}

interface AppContextProps {
  profile: UserProfile | null;
  quests: DailyQuest[];
  workoutSessions: WorkoutSession[];
  nutritionLogs: NutritionLog[];
  weightLogs: WeightLog[];
  achievements: Achievement[];
  progressPhotos: ProgressPhotos[];
  attributes: PlayerAttributes;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleQuest: (questId: string) => Promise<void>;
  updateQuestValue: (questId: string, value: number) => Promise<void>;
  logWorkoutSession: (session: Omit<WorkoutSession, 'id'>) => Promise<void>;
  addNutritionItem: (item: { name: string; calories: number; protein: number; waterMl: number }) => Promise<void>;
  addSteps: (steps: number) => Promise<void>;
  addWater: (ml: number) => Promise<void>;
  addSleepHours: (hours: number) => Promise<void>;
  logWeight: (weight: number, date?: string) => Promise<void>;
  savePhotos: (photos: Partial<ProgressPhotos>) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeWorkout: { name: string; duration: number; exercises: any[]; active: boolean } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startWorkout: (name: string, exercises: any[]) => void;
  updateActiveWorkoutDuration: (duration: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finishActiveWorkout: (sets: any[]) => Promise<void>;
  cancelActiveWorkout: () => void;
  showQuestCompleteGlow: boolean;
  setShowQuestCompleteGlow: (show: boolean) => void;
  justLeveledUp: { oldLevel: number; newLevel: number; title: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setJustLeveledUp: (val: any) => void;
  newAchievementUnlocked: Achievement | null;
  setNewAchievementUnlocked: (val: Achievement | null) => void;
  refreshData: () => Promise<void>;
  loading: boolean;
  error: string | null;
  authMode: 'supabase' | 'local';
  setAuthMode: (mode: 'supabase' | 'local') => void;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const DEFAULT_QUESTS = [
  { id: 'q-workout', name: 'Complete Workout', category: 'workout', current: 0, target: 1, unit: 'session', xpReward: 100, completed: false },
  { id: 'q-protein', name: 'Hit Protein Goal', category: 'protein', current: 0, target: 180, unit: 'g', xpReward: 50, completed: false },
  { id: 'q-water', name: 'Drink 3L Water', category: 'water', current: 0, target: 3000, unit: 'ml', xpReward: 30, completed: false },
  { id: 'q-steps', name: 'Walk 10k Steps', category: 'steps', current: 0, target: 10000, unit: 'steps', xpReward: 70, completed: false },
  { id: 'q-sleep', name: 'Sleep 8 Hours', category: 'sleep', current: 0, target: 8, unit: 'hrs', xpReward: 40, completed: false },
] as DailyQuest[];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhotos[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [authMode, setAuthModeState] = useState<'supabase' | 'local'>(() => {
    const saved = localStorage.getItem('forge_auth_mode');
    if (saved === 'local' || saved === 'supabase') return saved;
    return supabase ? 'supabase' : 'local';
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setAuthMode = (mode: 'supabase' | 'local') => {
    localStorage.setItem('forge_auth_mode', mode);
    setAuthModeState(mode);
  };

  // Active workout state
  const [activeWorkout, setActiveWorkout] = useState<AppContextProps['activeWorkout']>(() => {
    const saved = localStorage.getItem('forge_active_workout');
    return saved ? JSON.parse(saved) : null;
  });

  // UI trigger states
  const [showQuestCompleteGlow, setShowQuestCompleteGlow] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [justLeveledUp, setJustLeveledUp] = useState<any>(null);
  const [newAchievementUnlocked, setNewAchievementUnlocked] = useState<Achievement | null>(null);

  // Sync active workout to localstorage
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('forge_active_workout', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('forge_active_workout');
    }
  }, [activeWorkout]);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const p = await db.getProfile();
      const s = await db.getWorkoutSessions();
      const n = await db.getNutritionLogs();
      const w = await db.getWeightLogs();
      const a = await db.getAchievements();
      const ph = await db.getProgressPhotos();

      setProfile(p);
      setWorkoutSessions(s);
      setNutritionLogs(n);
      setWeightLogs(w);
      setAchievements(a);
      setProgressPhotos(ph);

      // Setup quests based on today's logs
      const todayStr = new Date().toISOString().split('T')[0];
      const todayNut = n.find(log => log.log_date === todayStr) || {
        log_date: todayStr,
        calories: 0,
        protein: 0,
        water_ml: 0,
        steps: 0,
        sleep_hours: 0
      };

      const todayWorkouts = s.filter(session => session.completed_at.startsWith(todayStr));

      // Map today's logs to active daily quests
      const updatedQuests = DEFAULT_QUESTS.map(q => {
        let current = 0;
        if (q.category === 'workout') current = todayWorkouts.length > 0 ? 1 : 0;
        else if (q.category === 'protein') current = todayNut.protein;
        else if (q.category === 'water') current = todayNut.water_ml;
        else if (q.category === 'steps') current = todayNut.steps;
        else if (q.category === 'sleep') current = todayNut.sleep_hours;

        const completed = current >= q.target;
        return { ...q, current, completed };
      });
      setQuests(updatedQuests);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      if (err?.message === 'Not authenticated' || err === 'Not authenticated') {
        setProfile(null);
      } else {
        setError(err?.message || 'Failed to sync with database.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync auth state if Supabase is active
  useEffect(() => {
    if (!supabase) {
      Promise.resolve().then(() => {
        setIsAuthenticated(false);
        setLoading(false);
        refreshData();
      });
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (authMode === 'supabase') {
        if (session) {
          refreshData();
        } else {
          setProfile(null);
          setLoading(false);
        }
      } else {
        refreshData();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (authMode === 'supabase') {
        if (event === 'SIGNED_IN' && session) {
          refreshData();
        } else if (event === 'SIGNED_OUT') {
          // Clear profile and data
          setProfile(null);
          setWorkoutSessions([]);
          setNutritionLogs([]);
          setWeightLogs([]);
          setProgressPhotos([]);
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [authMode]);

  // Effect to reload local sandbox data if authMode shifts to local
  useEffect(() => {
    if (authMode === 'local') {
      Promise.resolve().then(() => refreshData());
    }
  }, [authMode]);

  // Check achievements after data reload
  const checkAchievements = async (p: UserProfile, wLogs: WeightLog[], sessions: WorkoutSession[], nutLogs: NutritionLog[]) => {
    const achievementsToUnlock: string[] = [];

    // First workout
    if (sessions.length >= 1) {
      achievementsToUnlock.push('first_workout');
    }
    // 7 Day Streak
    if (p.streak >= 7) {
      achievementsToUnlock.push('streak_7');
    }
    // 30 Day Streak
    if (p.streak >= 30) {
      achievementsToUnlock.push('streak_30');
    }
    // Bench weights
    let maxBench = 0;
    sessions.forEach(s => {
      s.sets.forEach(set => {
        if (set.completed && set.exercise_name.toLowerCase().includes('bench')) {
          maxBench = Math.max(maxBench, set.weight);
        }
      });
    });
    if (maxBench >= 60) {
      achievementsToUnlock.push('bench_60');
    }
    // Squat weights
    let maxSquat = 0;
    sessions.forEach(s => {
      s.sets.forEach(set => {
        if (set.completed && set.exercise_name.toLowerCase().includes('squat')) {
          maxSquat = Math.max(maxSquat, set.weight);
        }
      });
    });
    if (maxSquat >= 100) {
      achievementsToUnlock.push('squat_100');
    }
    // Protein target (14 days)
    const proteinTargetCount = nutLogs.filter(n => n.protein >= 180).length;
    if (proteinTargetCount >= 14) {
      achievementsToUnlock.push('protein_king');
    }
    // Goal achieved
    if (wLogs.length > 1) {
      const currentWeight = wLogs[wLogs.length - 1].weight;
      const mainGoalLower = p.main_goal?.toLowerCase() || '';
      
      if (mainGoalLower.includes('loss') || mainGoalLower.includes('shred')) {
        if (currentWeight <= p.goal_weight) {
          achievementsToUnlock.push('goal_achieved');
        }
      } else if (mainGoalLower.includes('gain') || mainGoalLower.includes('bulk')) {
        if (currentWeight >= p.goal_weight) {
          achievementsToUnlock.push('goal_achieved');
        }
      }
    }

    // Process unlocks
    const unUnlocked = achievements.filter(a => !a.unlocked);
    for (const id of achievementsToUnlock) {
      const target = unUnlocked.find(a => a.id === id);
      if (target) {
        await db.unlockAchievement(id);
        setNewAchievementUnlocked(target);
        // Reward XP for achievement
        await addXP(target.xp_reward);
      }
    }
  };

  // Helper to add XP and check level ups
  const addXP = async (amount: number) => {
    if (!profile) return;
    const oldXp = profile.xp;
    const newXp = oldXp + amount;
    const oldLvlInfo = getLevelInfo(oldXp);
    const newLvlInfo = getLevelInfo(newXp);

    const updatedProfile = await db.updateProfile({ xp: newXp, level: newLvlInfo.level });
    setProfile(updatedProfile);

    if (newLvlInfo.level > oldLvlInfo.level) {
      // Trigger level up popup
      setJustLeveledUp({
        oldLevel: oldLvlInfo.level,
        newLevel: newLvlInfo.level,
        title: newLvlInfo.title
      });
    }
  };

  const checkAllQuestsComplete = async (updatedQuests: DailyQuest[]) => {
    if (!profile) return;
    
    const allDone = updatedQuests.every(q => q.completed);
    const todayStr = new Date().toISOString().split('T')[0];

    // If all quests completed and they weren't already completed today
    if (allDone && profile.last_quest_completed_date !== todayStr) {
      // Trigger quest complete animation
      setShowQuestCompleteGlow(true);
      
      // Calculate streak update
      let newStreak = profile.streak;
      let newMaxStreak = profile.max_streak;
      
      const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      if (profile.last_quest_completed_date === yesterdayStr) {
        newStreak += 1;
      } else if (profile.last_quest_completed_date !== todayStr) {
        newStreak = 1;
      }
      
      if (newStreak > newMaxStreak) {
        newMaxStreak = newStreak;
      }

      const updated = await db.updateProfile({
        streak: newStreak,
        max_streak: newMaxStreak,
        last_quest_completed_date: todayStr
      });
      setProfile(updated);

      // Reward quest completion (+300 XP)
      await addXP(300);
    }
  };

  const toggleQuest = async (questId: string) => {
    const updated = quests.map(q => {
      if (q.id === questId) {
        const completed = !q.completed;
        const current = completed ? q.target : 0;
        return { ...q, current, completed };
      }
      return q;
    });

    setQuests(updated);
    
    // Find quest for XP reward
    const targetQuest = quests.find(q => q.id === questId);
    if (targetQuest) {
      const isNowCompleted = !targetQuest.completed;
      await addXP(isNowCompleted ? targetQuest.xpReward : -targetQuest.xpReward);
      
      // Update nutrition logs accordingly if it maps to macro/steps
      const todayStr = new Date().toISOString().split('T')[0];
      const todayNut = nutritionLogs.find(l => l.log_date === todayStr) || {
        log_date: todayStr, calories: 1500, protein: 120, water_ml: 1500, steps: 5000, sleep_hours: 6
      };

      if (questId === 'q-protein') todayNut.protein = isNowCompleted ? 180 : 0;
      else if (questId === 'q-water') todayNut.water_ml = isNowCompleted ? 3000 : 0;
      else if (questId === 'q-steps') todayNut.steps = isNowCompleted ? 10000 : 0;
      else if (questId === 'q-sleep') todayNut.sleep_hours = isNowCompleted ? 8 : 0;

      const savedNut = await db.saveNutritionLog(todayNut);
      setNutritionLogs(prev => prev.map(l => l.log_date === todayStr ? savedNut : l));

      if (isNowCompleted) {
        await checkAllQuestsComplete(updated);
      }
    }
  };

  const updateQuestValue = async (questId: string, value: number) => {
    const updated = quests.map(q => {
      if (q.id === questId) {
        const current = value;
        const completed = current >= q.target;
        return { ...q, current, completed };
      }
      return q;
    });

    setQuests(updated);

    const targetQuest = quests.find(q => q.id === questId);
    if (targetQuest) {
      const wasCompleted = targetQuest.completed;
      const isCompleted = value >= targetQuest.target;
      
      if (!wasCompleted && isCompleted) {
        await addXP(targetQuest.xpReward);
        await checkAllQuestsComplete(updated);
      } else if (wasCompleted && !isCompleted) {
        await addXP(-targetQuest.xpReward);
      }
    }
  };

  const logWorkoutSession = async (session: Omit<WorkoutSession, 'id'>) => {
    const saved = await db.saveWorkoutSession(session);
    setWorkoutSessions(prev => [...prev, saved]);
    
    // Reward XP
    await addXP(100);
    
    // Update daily quests
    const updated = quests.map(q => {
      if (q.category === 'workout') {
        return { ...q, current: 1, completed: true };
      }
      return q;
    });
    setQuests(updated);
    await checkAllQuestsComplete(updated);
    
    // Refresh achievements & attributes
    if (profile) {
      await checkAchievements(profile, weightLogs, [...workoutSessions, saved], nutritionLogs);
    }
  };

  const addNutritionItem = async (item: { name: string; calories: number; protein: number; waterMl: number }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayNut = nutritionLogs.find(l => l.log_date === todayStr) || {
      log_date: todayStr, calories: 0, protein: 0, water_ml: 0, steps: 0, sleep_hours: 0
    };

    const newLog = {
      ...todayNut,
      calories: todayNut.calories + item.calories,
      protein: todayNut.protein + item.protein,
      water_ml: todayNut.water_ml + item.waterMl
    };

    const saved = await db.saveNutritionLog(newLog);
    setNutritionLogs(prev => {
      const idx = prev.findIndex(l => l.log_date === todayStr);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    // Update protein quest
    await updateQuestValue('q-protein', newLog.protein);
    // Update water quest
    await updateQuestValue('q-water', newLog.water_ml);
  };

  const addSteps = async (steps: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayNut = nutritionLogs.find(l => l.log_date === todayStr) || {
      log_date: todayStr, calories: 0, protein: 0, water_ml: 0, steps: 0, sleep_hours: 0
    };

    const newLog = {
      ...todayNut,
      steps: todayNut.steps + steps
    };

    const saved = await db.saveNutritionLog(newLog);
    setNutritionLogs(prev => {
      const idx = prev.findIndex(l => l.log_date === todayStr);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    await updateQuestValue('q-steps', newLog.steps);
  };

  const addWater = async (ml: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayNut = nutritionLogs.find(l => l.log_date === todayStr) || {
      log_date: todayStr, calories: 0, protein: 0, water_ml: 0, steps: 0, sleep_hours: 0
    };

    const newLog = {
      ...todayNut,
      water_ml: todayNut.water_ml + ml
    };

    const saved = await db.saveNutritionLog(newLog);
    setNutritionLogs(prev => {
      const idx = prev.findIndex(l => l.log_date === todayStr);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    await updateQuestValue('q-water', newLog.water_ml);
  };

  const addSleepHours = async (hours: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayNut = nutritionLogs.find(l => l.log_date === todayStr) || {
      log_date: todayStr, calories: 0, protein: 0, water_ml: 0, steps: 0, sleep_hours: 0
    };

    const newLog = {
      ...todayNut,
      sleep_hours: todayNut.sleep_hours + hours
    };

    const saved = await db.saveNutritionLog(newLog);
    setNutritionLogs(prev => {
      const idx = prev.findIndex(l => l.log_date === todayStr);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    await updateQuestValue('q-sleep', newLog.sleep_hours);
  };

  const logWeight = async (weight: number, date?: string) => {
    const saved = await db.saveWeightLog(weight, date);
    setWeightLogs(prev => {
      const logDate = date || new Date().toISOString().split('T')[0];
      const idx = prev.findIndex(l => l.log_date === logDate);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved].sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
    });

    // Sync weight log to current weight in profile
    if (profile) {
      const updated = await db.updateProfile({ current_weight: weight });
      setProfile(updated);
      await checkAchievements(updated, [...weightLogs, saved], workoutSessions, nutritionLogs);
    }
  };

  const savePhotos = async (photos: Partial<ProgressPhotos>) => {
    const saved = await db.saveProgressPhotos(photos);
    setProgressPhotos(prev => {
      const logDate = photos.log_date || new Date().toISOString().split('T')[0];
      const idx = prev.findIndex(l => l.log_date === logDate);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  // Workout state controllers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startWorkout = (name: string, exercises: any[]) => {
    setActiveWorkout({
      name,
      duration: 0,
      exercises: exercises.map(ex => ({
        ...ex,
        sets: Array.from({ length: ex.target_sets }).map((_, idx) => ({
          set_number: idx + 1,
          weight: 0,
          reps: ex.target_reps,
          completed: false
        }))
      })),
      active: true
    });
  };

  const updateActiveWorkoutDuration = (duration: number) => {
    setActiveWorkout(prev => prev ? { ...prev, duration } : null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finishActiveWorkout = async (sets: any[]) => {
    if (!activeWorkout) return;
    
    const setsToLog = sets.map(s => ({
      exercise_name: s.exercise_name,
      set_number: s.set_number,
      weight: s.weight,
      reps: s.reps,
      completed: s.completed
    }));

    await logWorkoutSession({
      workout_name: activeWorkout.name,
      started_at: new Date(Date.now() - activeWorkout.duration * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: activeWorkout.duration,
      sets: setsToLog
    });

    setActiveWorkout(null);
  };

  const cancelActiveWorkout = () => {
    setActiveWorkout(null);
  };

  // Derived Attributes
  const questHistoryRate = quests.length > 0 
    ? (quests.filter(q => q.completed).length / quests.length) * 100 
    : 0;

  const attributes = profile 
    ? calculatePlayerAttributes(profile, workoutSessions, weightLogs, questHistoryRate) 
    : { strength: 10, discipline: 10, consistency: 10, endurance: 10, agility: 10 };

  const signOut = async () => {
    if (supabase && authMode === 'supabase') {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setWorkoutSessions([]);
    setNutritionLogs([]);
    setWeightLogs([]);
    setProgressPhotos([]);
  };

  return (
    <AppContext.Provider value={{
      profile,
      quests,
      workoutSessions,
      nutritionLogs,
      weightLogs,
      achievements,
      progressPhotos,
      attributes,
      activeTab,
      setActiveTab,
      toggleQuest,
      updateQuestValue,
      logWorkoutSession,
      addNutritionItem,
      addSteps,
      addWater,
      addSleepHours,
      logWeight,
      savePhotos,
      activeWorkout,
      startWorkout,
      updateActiveWorkoutDuration,
      finishActiveWorkout,
      cancelActiveWorkout,
      showQuestCompleteGlow,
      setShowQuestCompleteGlow,
      justLeveledUp,
      setJustLeveledUp,
      newAchievementUnlocked,
      setNewAchievementUnlocked,
      refreshData,
      loading,
      error,
      authMode,
      setAuthMode,
      signOut,
      isAuthenticated
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
