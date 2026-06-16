-- Create schemas and extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
-- PROFILES
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT DEFAULT '',
    age INTEGER DEFAULT 0,
    height NUMERIC(5,2) DEFAULT 0,
    current_weight NUMERIC(5,2) DEFAULT 0,
    goal_weight NUMERIC(5,2) DEFAULT 0,
    diet_type TEXT DEFAULT 'General',
    theme TEXT DEFAULT 'FORGE',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_quest_completed_date DATE,
    main_goal TEXT DEFAULT '',
    activity_level TEXT DEFAULT '',
    workout_preference TEXT DEFAULT '',
    experience_level TEXT DEFAULT '',
    is_onboarded BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- WORKOUTS (Templates)
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EXERCISES (Template exercises)
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g. 'Chest', 'Back'
    target_sets INTEGER DEFAULT 3,
    target_reps INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0
);

-- WORKOUT SESSIONS (Historical logged workouts)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
    workout_name TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0
);

-- WORKOUT SETS (Sets completed in a session)
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
    exercise_name TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight NUMERIC(6,2) NOT NULL,
    reps INTEGER NOT NULL,
    completed BOOLEAN DEFAULT TRUE
);

-- NUTRITION LOGS (Daily calories, steps, etc)
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    calories INTEGER DEFAULT 0,
    protein INTEGER DEFAULT 0,
    water_ml INTEGER DEFAULT 0,
    steps INTEGER DEFAULT 0,
    sleep_hours NUMERIC(4,2) DEFAULT 0,
    CONSTRAINT unique_profile_date UNIQUE (profile_id, log_date)
);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 100
);

-- USER ACHIEVEMENTS (Unlocked milestones)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    achievement_id TEXT REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_achievement UNIQUE (profile_id, achievement_id)
);

-- PROGRESS PHOTOS
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    photo_date DATE NOT NULL,
    front_url TEXT,
    side_url TEXT,
    back_url TEXT,
    CONSTRAINT unique_photo_date UNIQUE (profile_id, photo_date)
);

-- WEIGHT LOGS
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    CONSTRAINT unique_weight_date UNIQUE (profile_id, log_date)
);

-- Seed achievements data
INSERT INTO public.achievements (id, name, description, icon, xp_reward) VALUES
('first_workout', 'First Workout', 'Initiated into the forge. The first strike of the hammer upon the anvil.', 'fitness_center', 50),
('streak_7', '7 Day Streak', 'A week of unbroken discipline. The fire is catching.', 'local_fire_department', 150),
('streak_30', '30 Day Streak', 'Thirty days of relentless dedication. You are becoming unbreakable.', 'calendar_month', 300),
('protein_king', 'Protein King', 'Hit protein macro targets consistently. Fueling the machine.', 'restaurant', 200),
('bench_60', 'Bench 60kg', 'Pushed past the 60kg barrier. True strength requires resistance.', 'sports_gymnastics', 500),
('squat_100', 'Squat 100kg', 'Squatted 100kg. Grounded power.', 'fitness_center', 750),
('goal_achieved', 'Goal Achieved', 'Reached your primary target weight goal. The master artisan has crafted a masterpiece.', 'emoji_events', 1000)
ON CONFLICT (id) DO NOTHING;

-- ===================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles policies
CREATE POLICY "Allow users to read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Workouts policies
CREATE POLICY "Allow users to manage their own workouts" ON public.workouts
    FOR ALL USING (auth.uid() = profile_id);

-- 3. Exercises policies
CREATE POLICY "Allow users to manage exercises for their workouts" ON public.exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = exercises.workout_id AND workouts.profile_id = auth.uid()
        )
    );

-- 4. Workout Sessions policies
CREATE POLICY "Allow users to manage their own workout sessions" ON public.workout_sessions
    FOR ALL USING (auth.uid() = profile_id);

-- 5. Workout Sets policies
CREATE POLICY "Allow users to manage sets for their workout sessions" ON public.workout_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions
            WHERE workout_sessions.id = workout_sets.session_id AND workout_sessions.profile_id = auth.uid()
        )
    );

-- 6. Nutrition Logs policies
CREATE POLICY "Allow users to manage their own nutrition logs" ON public.nutrition_logs
    FOR ALL USING (auth.uid() = profile_id);

-- 7. Achievements policies (read-only for all users)
CREATE POLICY "Allow anyone to read achievements" ON public.achievements
    FOR SELECT USING (true);

-- 8. User Achievements policies
CREATE POLICY "Allow users to manage their own achievements" ON public.user_achievements
    FOR ALL USING (auth.uid() = profile_id);

-- 9. Progress Photos policies
CREATE POLICY "Allow users to manage their own progress photos" ON public.progress_photos
    FOR ALL USING (auth.uid() = profile_id);

-- 10. Weight Logs policies
CREATE POLICY "Allow users to manage their own weight logs" ON public.weight_logs
    FOR ALL USING (auth.uid() = profile_id);

-- ===================================================
-- STORAGE BUCKETS CONFIGURATION & POLICIES
-- ===================================================

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for progress-photos bucket
CREATE POLICY "Allow public read access to progress photos"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'progress-photos');

CREATE POLICY "Allow users to upload progress photos to their own folder"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'progress-photos' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Allow users to update/delete progress photos in their own folder"
    ON storage.objects FOR ALL TO authenticated
    USING (
        bucket_id = 'progress-photos' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

