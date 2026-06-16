import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  height: number;
  current_weight: number;
  goal_weight: number;
  diet_type: string;
  theme: 'FORGE' | 'ASCEND';
  xp: number;
  level: number;
  streak: number;
  max_streak: number;
  last_quest_completed_date: string | null;
  start_date: string;
  main_goal?: string;
  activity_level?: string;
  workout_preference?: string;
  experience_level?: string;
  is_onboarded?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: ExerciseTemplate[];
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  category: string;
  target_sets: number;
  target_reps: number;
}

export interface WorkoutSession {
  id: string;
  workout_name: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  exercise_name: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface NutritionLog {
  log_date: string;
  calories: number;
  protein: number;
  water_ml: number;
  steps: number;
  sleep_hours: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface WeightLog {
  log_date: string;
  weight: number;
}

export interface ProgressPhotos {
  log_date: string;
  front_url: string;
  side_url: string;
  back_url: string;
}

// Interface for database operations
export interface DatabaseAdapter {
  getProfile(): Promise<UserProfile>;
  updateProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
  getWorkouts(): Promise<WorkoutTemplate[]>;
  createWorkout(workout: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate>;
  deleteWorkout(id: string): Promise<void>;
  saveWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession>;
  getWorkoutSessions(): Promise<WorkoutSession[]>;
  getNutritionLogs(): Promise<NutritionLog[]>;
  saveNutritionLog(log: NutritionLog): Promise<NutritionLog>;
  getAchievements(): Promise<Achievement[]>;
  unlockAchievement(id: string): Promise<void>;
  getWeightLogs(): Promise<WeightLog[]>;
  saveWeightLog(weight: number, date?: string): Promise<WeightLog>;
  getProgressPhotos(): Promise<ProgressPhotos[]>;
  saveProgressPhotos(photos: Partial<ProgressPhotos>): Promise<ProgressPhotos>;
}

// Initial Mock Seed Data - Clean Slate Starting at Level 0
const MOCK_PROFILE: UserProfile = {
  id: 'mock-user-id',
  name: '',
  age: 0,
  height: 0,
  current_weight: 0,
  goal_weight: 0,
  diet_type: 'General',
  theme: 'FORGE',
  xp: 0,
  level: 0,
  streak: 0,
  max_streak: 0,
  last_quest_completed_date: null,
  start_date: new Date().toISOString(),
  main_goal: '',
  activity_level: '',
  workout_preference: '',
  experience_level: '',
  is_onboarded: false
};

const MOCK_WORKOUTS: WorkoutTemplate[] = [];
const MOCK_WEIGHT_LOGS: WeightLog[] = [];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_workout', name: 'First Workout', description: 'Initiated into the forge. The first strike of the hammer upon the anvil.', icon: 'fitness_center', xp_reward: 50, unlocked: false },
  { id: 'streak_7', name: '7 Day Streak', description: 'A week of unbroken discipline. The fire is catching.', icon: 'local_fire_department', xp_reward: 150, unlocked: false },
  { id: 'protein_king', name: 'Protein King', description: 'Hit protein target for 14 consecutive days. Fueling the machine.', icon: 'restaurant', xp_reward: 200, unlocked: false },
  { id: 'bench_60', name: 'Bench 60kg', description: 'Pushed past the 60kg barrier. True strength requires resistance.', icon: 'sports_gymnastics', xp_reward: 500, unlocked: false },
  { id: 'streak_30', name: '30 Day Streak', description: 'Thirty days of relentless dedication. You are becoming unbreakable.', icon: 'calendar_month', xp_reward: 300, unlocked: false },
  { id: 'squat_100', name: 'Squat 100kg', description: 'Squatted 100kg. Grounded power.', icon: 'fitness_center', xp_reward: 750, unlocked: false },
  { id: 'goal_achieved', name: 'Goal Achieved', description: 'Reached your primary target weight goal. The master artisan has crafted a masterpiece.', icon: 'emoji_events', xp_reward: 1000, unlocked: false },
];

const MOCK_NUTRITION: NutritionLog[] = [];
const MOCK_PHOTOS: ProgressPhotos[] = [];

// Local Storage Implementation
class LocalStorageAdapter implements DatabaseAdapter {
  private get<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);
    if (!data) {
      this.set(key, defaultValue);
      return defaultValue;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async getProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('forge_profile', MOCK_PROFILE);
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated = { ...current, ...profile, updated_at: new Date().toISOString() };
    this.set('forge_profile', updated);
    return updated;
  }

  async getWorkouts(): Promise<WorkoutTemplate[]> {
    return this.get<WorkoutTemplate[]>('forge_workouts', MOCK_WORKOUTS);
  }

  async createWorkout(workout: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate> {
    const workouts = await this.getWorkouts();
    const newWorkout: WorkoutTemplate = {
      ...workout,
      id: 'workout-' + Math.random().toString(36).substring(2, 9),
    };
    workouts.push(newWorkout);
    this.set('forge_workouts', workouts);
    return newWorkout;
  }

  async deleteWorkout(id: string): Promise<void> {
    const workouts = await this.getWorkouts();
    const filtered = workouts.filter(w => w.id !== id);
    this.set('forge_workouts', filtered);
  }

  async saveWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession> {
    const sessions = this.get<WorkoutSession[]>('forge_sessions', []);
    const newSession: WorkoutSession = {
      ...session,
      id: 'session-' + Math.random().toString(36).substring(2, 9)
    };
    sessions.push(newSession);
    this.set('forge_sessions', sessions);
    return newSession;
  }

  async getWorkoutSessions(): Promise<WorkoutSession[]> {
    return this.get<WorkoutSession[]>('forge_sessions', []);
  }

  async getNutritionLogs(): Promise<NutritionLog[]> {
    return this.get<NutritionLog[]>('forge_nutrition', MOCK_NUTRITION);
  }

  async saveNutritionLog(log: NutritionLog): Promise<NutritionLog> {
    const logs = await this.getNutritionLogs();
    const existingIndex = logs.findIndex(l => l.log_date === log.log_date);
    if (existingIndex > -1) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    this.set('forge_nutrition', logs);
    return log;
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.get<Achievement[]>('forge_achievements', MOCK_ACHIEVEMENTS);
  }

  async unlockAchievement(id: string): Promise<void> {
    const achievements = await this.getAchievements();
    const match = achievements.find(a => a.id === id);
    if (match && !match.unlocked) {
      match.unlocked = true;
      match.unlocked_at = new Date().toISOString().split('T')[0];
      this.set('forge_achievements', achievements);
    }
  }

  async getWeightLogs(): Promise<WeightLog[]> {
    return this.get<WeightLog[]>('forge_weight', MOCK_WEIGHT_LOGS);
  }

  async saveWeightLog(weight: number, date?: string): Promise<WeightLog> {
    const logDate = date || new Date().toISOString().split('T')[0];
    const logs = await this.getWeightLogs();
    const newLog = { log_date: logDate, weight };
    
    const existingIndex = logs.findIndex(l => l.log_date === logDate);
    if (existingIndex > -1) {
      logs[existingIndex] = newLog;
    } else {
      logs.push(newLog);
    }
    // Sort chronologically
    logs.sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
    this.set('forge_weight', logs);
    return newLog;
  }

  async getProgressPhotos(): Promise<ProgressPhotos[]> {
    return this.get<ProgressPhotos[]>('forge_photos', MOCK_PHOTOS);
  }

  async saveProgressPhotos(photos: Partial<ProgressPhotos>): Promise<ProgressPhotos> {
    const logDate = photos.log_date || new Date().toISOString().split('T')[0];
    const logs = await this.getProgressPhotos();
    const existingIndex = logs.findIndex(l => l.log_date === logDate);
    
    const defaultLog: ProgressPhotos = { log_date: logDate, front_url: '', side_url: '', back_url: '' };
    const record = existingIndex > -1 ? { ...logs[existingIndex], ...photos } : { ...defaultLog, ...photos };
    
    if (existingIndex > -1) {
      logs[existingIndex] = record;
    } else {
      logs.push(record);
    }
    this.set('forge_photos', logs);
    return record;
  }
}

// Supabase Implementation
class SupabaseAdapterImpl implements DatabaseAdapter {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getProfile(): Promise<UserProfile> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) {
      // Create profile if it does not exist
      const newProfile = {
        id: user.id,
        name: '',
        theme: 'FORGE',
        xp: 0,
        level: 0,
        streak: 0,
        max_streak: 0,
        is_onboarded: false,
      };
      const { data: inserted, error: insertError } = await this.supabase
        .from('profiles')
        .insert(newProfile)
        .select('*')
        .single();
      if (insertError) throw insertError;
      return inserted;
    }
    return data;
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id)
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  }

  async getWorkouts(): Promise<WorkoutTemplate[]> {
    const { data, error } = await this.supabase
      .from('workouts')
      .select('*, exercises(*)');
      
    if (error) throw error;
    return data || [];
  }

  async createWorkout(workout: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: savedWorkout, error: workoutError } = await this.supabase
      .from('workouts')
      .insert({
        profile_id: user.id,
        name: workout.name,
        description: workout.description,
      })
      .select('*')
      .single();
      
    if (workoutError) throw workoutError;

    const exercisesToInsert = workout.exercises.map((e, index) => ({
      workout_id: savedWorkout.id,
      name: e.name,
      category: e.category,
      target_sets: e.target_sets,
      target_reps: e.target_reps,
      order_index: index,
    }));

    const { data: savedExercises, error: exercisesError } = await this.supabase
      .from('exercises')
      .insert(exercisesToInsert)
      .select('*');

    if (exercisesError) throw exercisesError;

    return {
      ...savedWorkout,
      exercises: savedExercises
    };
  }

  async deleteWorkout(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('workouts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async saveWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: savedSession, error: sessionError } = await this.supabase
      .from('workout_sessions')
      .insert({
        profile_id: user.id,
        workout_name: session.workout_name,
        started_at: session.started_at,
        completed_at: session.completed_at,
        duration_seconds: session.duration_seconds
      })
      .select('*')
      .single();
      
    if (sessionError) throw sessionError;

    const setsToInsert = session.sets.map(s => ({
      session_id: savedSession.id,
      exercise_name: s.exercise_name,
      set_number: s.set_number,
      weight: s.weight,
      reps: s.reps,
      completed: s.completed
    }));

    const { data: savedSets, error: setsError } = await this.supabase
      .from('workout_sets')
      .insert(setsToInsert)
      .select('*');

    if (setsError) throw setsError;

    return {
      ...savedSession,
      sets: savedSets
    };
  }

  async getWorkoutSessions(): Promise<WorkoutSession[]> {
    const { data, error } = await this.supabase
      .from('workout_sessions')
      .select('*, workout_sets(*)');
      
    if (error) throw error;
    // Map backend keys to client keys
    return (data || []).map(s => ({
      id: s.id,
      workout_name: s.workout_name,
      started_at: s.started_at,
      completed_at: s.completed_at,
      duration_seconds: s.duration_seconds,
      sets: s.workout_sets || []
    }));
  }

  async getNutritionLogs(): Promise<NutritionLog[]> {
    const { data, error } = await this.supabase
      .from('nutrition_logs')
      .select('*');
    if (error) throw error;
    return data || [];
  }

  async saveNutritionLog(log: NutritionLog): Promise<NutritionLog> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('nutrition_logs')
      .upsert({
        profile_id: user.id,
        log_date: log.log_date,
        calories: log.calories,
        protein: log.protein,
        water_ml: log.water_ml,
        steps: log.steps,
        sleep_hours: log.sleep_hours
      })
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  }

  async getAchievements(): Promise<Achievement[]> {
    const { data: allAchievements, error: allErr } = await this.supabase
      .from('achievements')
      .select('*');
    if (allErr) throw allErr;

    const { data: userAchievements, error: userErr } = await this.supabase
      .from('user_achievements')
      .select('*');
    if (userErr) throw userErr;

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
    const userUnlockTimes = userAchievements?.reduce((acc, curr) => {
      acc[curr.achievement_id] = curr.unlocked_at;
      return acc;
    }, {} as Record<string, string>) || {};

    return (allAchievements || []).map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xp_reward: a.xp_reward,
      unlocked: unlockedIds.has(a.id),
      unlocked_at: userUnlockTimes[a.id]
    }));
  }

  async unlockAchievement(id: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('user_achievements')
      .insert({
        profile_id: user.id,
        achievement_id: id
      });
      
    if (error && error.code !== '23505') { // Ignore duplicate key errors
      throw error;
    }
  }

  async getWeightLogs(): Promise<WeightLog[]> {
    const { data, error } = await this.supabase
      .from('weight_logs')
      .select('*')
      .order('log_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async saveWeightLog(weight: number, date?: string): Promise<WeightLog> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const logDate = date || new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase
      .from('weight_logs')
      .upsert({
        profile_id: user.id,
        log_date: logDate,
        weight: weight
      })
      .select('*')
      .single();
      
    if (error) throw error;
    return data;
  }

  async getProgressPhotos(): Promise<ProgressPhotos[]> {
    const { data, error } = await this.supabase
      .from('progress_photos')
      .select('*')
      .order('photo_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(p => ({
      log_date: p.photo_date,
      front_url: p.front_url || '',
      side_url: p.side_url || '',
      back_url: p.back_url || ''
    }));
  }

  async saveProgressPhotos(photos: Partial<ProgressPhotos>): Promise<ProgressPhotos> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const logDate = photos.log_date || new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase
      .from('progress_photos')
      .upsert({
        profile_id: user.id,
        photo_date: logDate,
        front_url: photos.front_url,
        side_url: photos.side_url,
        back_url: photos.back_url
      })
      .select('*')
      .single();
      
    if (error) throw error;
    return {
      log_date: data.photo_date,
      front_url: data.front_url || '',
      side_url: data.side_url || '',
      back_url: data.back_url || ''
    };
  }
}

// ===================================================
// SUPABASE CLIENT INITIALIZATION
// ===================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' && 
  supabaseAnonKey !== 'PLACEHOLDER_ANON_KEY' &&
  supabaseAnonKey !== '';

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ===================================================
// DYNAMIC ADAPTER CONFIGURATION
// ===================================================

class DynamicDatabaseAdapter implements DatabaseAdapter {
  private local = new LocalStorageAdapter();
  private remote = supabase ? new SupabaseAdapterImpl(supabase) : null;

  private get activeAdapter(): DatabaseAdapter {
    const mode = localStorage.getItem('forge_auth_mode');
    if (mode === 'local' || !this.remote) {
      return this.local;
    }
    return this.remote;
  }

  async getProfile(): Promise<UserProfile> {
    return this.activeAdapter.getProfile();
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return this.activeAdapter.updateProfile(profile);
  }

  async getWorkouts(): Promise<WorkoutTemplate[]> {
    return this.activeAdapter.getWorkouts();
  }

  async createWorkout(workout: Omit<WorkoutTemplate, 'id'>): Promise<WorkoutTemplate> {
    return this.activeAdapter.createWorkout(workout);
  }

  async deleteWorkout(id: string): Promise<void> {
    return this.activeAdapter.deleteWorkout(id);
  }

  async saveWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession> {
    return this.activeAdapter.saveWorkoutSession(session);
  }

  async getWorkoutSessions(): Promise<WorkoutSession[]> {
    return this.activeAdapter.getWorkoutSessions();
  }

  async getNutritionLogs(): Promise<NutritionLog[]> {
    return this.activeAdapter.getNutritionLogs();
  }

  async saveNutritionLog(log: NutritionLog): Promise<NutritionLog> {
    return this.activeAdapter.saveNutritionLog(log);
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.activeAdapter.getAchievements();
  }

  async unlockAchievement(id: string): Promise<void> {
    return this.activeAdapter.unlockAchievement(id);
  }

  async getWeightLogs(): Promise<WeightLog[]> {
    return this.activeAdapter.getWeightLogs();
  }

  async saveWeightLog(weight: number, date?: string): Promise<WeightLog> {
    return this.activeAdapter.saveWeightLog(weight, date);
  }

  async getProgressPhotos(): Promise<ProgressPhotos[]> {
    return this.activeAdapter.getProgressPhotos();
  }

  async saveProgressPhotos(photos: Partial<ProgressPhotos>): Promise<ProgressPhotos> {
    return this.activeAdapter.saveProgressPhotos(photos);
  }
}

export const db = new DynamicDatabaseAdapter();
export { supabaseUrl }; // exported for auth visibility if needed



