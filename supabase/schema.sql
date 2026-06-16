-- ============================================================
--  FORGE × ASCEND — Complete Supabase Schema
--  Paste this entire file into the Supabase SQL Editor and run.
--  Safe to re-run: uses IF NOT EXISTS / ON CONFLICT guards.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

-- 1.1  PROFILES
--      One row per auth user. Created automatically by trigger.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id                      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name                    TEXT        NOT NULL DEFAULT '',
    age                     INTEGER     NOT NULL DEFAULT 0,
    height                  NUMERIC(5,2) NOT NULL DEFAULT 0,        -- cm
    current_weight          NUMERIC(5,2) NOT NULL DEFAULT 0,        -- kg
    goal_weight             NUMERIC(5,2) NOT NULL DEFAULT 0,        -- kg
    diet_type               TEXT        NOT NULL DEFAULT 'General',
    theme                   TEXT        NOT NULL DEFAULT 'FORGE'
                                CHECK (theme IN ('FORGE', 'ASCEND')),
    xp                      INTEGER     NOT NULL DEFAULT 0 CHECK (xp >= 0),
    level                   INTEGER     NOT NULL DEFAULT 0 CHECK (level >= 0),
    streak                  INTEGER     NOT NULL DEFAULT 0 CHECK (streak >= 0),
    max_streak              INTEGER     NOT NULL DEFAULT 0 CHECK (max_streak >= 0),
    last_quest_completed_date DATE       DEFAULT NULL,
    main_goal               TEXT        NOT NULL DEFAULT '',
    activity_level          TEXT        NOT NULL DEFAULT '',
    workout_preference      TEXT        NOT NULL DEFAULT '',
    experience_level        TEXT        NOT NULL DEFAULT '',
    is_onboarded            BOOLEAN     NOT NULL DEFAULT FALSE,
    start_date              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'One profile per authenticated user. Auto-created on signup.';

-- 1.2  WORKOUT TEMPLATES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workouts (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.workouts IS 'User-created workout templates.';

-- 1.3  TEMPLATE EXERCISES  (belong to a workout template)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercises (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id  UUID        NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    category    TEXT        NOT NULL DEFAULT 'General',
    target_sets INTEGER     NOT NULL DEFAULT 3 CHECK (target_sets > 0),
    target_reps INTEGER     NOT NULL DEFAULT 10 CHECK (target_reps > 0),
    order_index INTEGER     NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.exercises IS 'Exercises within a workout template, ordered by order_index.';

-- 1.4  WORKOUT SESSIONS  (completed/historical logs)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id       UUID        REFERENCES public.workouts(id) ON DELETE SET NULL,
    workout_name     TEXT        NOT NULL,
    started_at       TIMESTAMPTZ NOT NULL,
    completed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_seconds INTEGER     NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0)
);

COMMENT ON TABLE public.workout_sessions IS 'One row per completed workout session.';

-- 1.5  WORKOUT SETS  (individual sets logged in a session)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id    UUID        NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT        NOT NULL,
    set_number    INTEGER     NOT NULL CHECK (set_number > 0),
    weight        NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (weight >= 0),
    reps          INTEGER     NOT NULL DEFAULT 0 CHECK (reps >= 0),
    completed     BOOLEAN     NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE public.workout_sets IS 'Individual sets recorded within a workout session.';

-- 1.6  NUTRITION LOGS  (one row per user per calendar day)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date    DATE        NOT NULL,
    calories    INTEGER     NOT NULL DEFAULT 0 CHECK (calories >= 0),
    protein     INTEGER     NOT NULL DEFAULT 0 CHECK (protein >= 0),  -- grams
    water_ml    INTEGER     NOT NULL DEFAULT 0 CHECK (water_ml >= 0),
    steps       INTEGER     NOT NULL DEFAULT 0 CHECK (steps >= 0),
    sleep_hours NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (sleep_hours >= 0),
    CONSTRAINT uq_nutrition_profile_date UNIQUE (profile_id, log_date)
);

COMMENT ON TABLE public.nutrition_logs IS 'Daily nutrition, hydration, steps and sleep log.';

-- 1.7  WEIGHT LOGS  (one row per user per calendar day)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date    DATE        NOT NULL,
    weight      NUMERIC(5,2) NOT NULL CHECK (weight > 0),
    CONSTRAINT uq_weight_profile_date UNIQUE (profile_id, log_date)
);

COMMENT ON TABLE public.weight_logs IS 'Daily body weight entries.';

-- 1.8  PROGRESS PHOTOS  (one row per user per calendar day)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    photo_date  DATE        NOT NULL,
    front_url   TEXT,
    side_url    TEXT,
    back_url    TEXT,
    CONSTRAINT uq_photo_profile_date UNIQUE (profile_id, photo_date)
);

COMMENT ON TABLE public.progress_photos IS 'Before/after progress photos linked to a user.';

-- 1.9  GLOBAL ACHIEVEMENTS CATALOGUE  (seed data, shared across all users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
    id          TEXT        PRIMARY KEY,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL,
    icon        TEXT        NOT NULL,       -- Material Symbol name
    xp_reward   INTEGER     NOT NULL DEFAULT 100 CHECK (xp_reward >= 0)
);

COMMENT ON TABLE public.achievements IS 'Global catalogue of all possible achievements.';

-- 1.10  USER ACHIEVEMENTS  (which achievements each user has unlocked)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id  TEXT        NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_achievement UNIQUE (profile_id, achievement_id)
);

COMMENT ON TABLE public.user_achievements IS 'Junction table tracking which achievements each user has unlocked.';


-- ────────────────────────────────────────────────────────────
-- 2. INDEXES  (beyond primary keys)
-- ────────────────────────────────────────────────────────────

-- profiles: nothing extra — PK is the user id, covered by RLS
CREATE INDEX IF NOT EXISTS idx_workouts_profile_id          ON public.workouts(profile_id);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id         ON public.exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_profile_id  ON public.workout_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started_at  ON public.workout_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session_id      ON public.workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_profile_date  ON public.nutrition_logs(profile_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_logs_profile_date     ON public.weight_logs(profile_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_photos_profile_date ON public.progress_photos(profile_id, photo_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_profile_id ON public.user_achievements(profile_id);


-- ────────────────────────────────────────────────────────────
-- 3. SEED: ACHIEVEMENTS CATALOGUE
-- ────────────────────────────────────────────────────────────
INSERT INTO public.achievements (id, name, description, icon, xp_reward) VALUES
  (
    'first_workout',
    'First Workout',
    'Initiated into the forge. The first strike of the hammer upon the anvil.',
    'fitness_center',
    50
  ),
  (
    'streak_7',
    '7 Day Streak',
    'A week of unbroken discipline. The fire is catching.',
    'local_fire_department',
    150
  ),
  (
    'streak_30',
    '30 Day Streak',
    'Thirty days of relentless dedication. You are becoming unbreakable.',
    'calendar_month',
    300
  ),
  (
    'protein_king',
    'Protein King',
    'Hit protein macro targets consistently. Fueling the machine.',
    'restaurant',
    200
  ),
  (
    'bench_60',
    'Bench 60kg',
    'Pushed past the 60kg barrier. True strength requires resistance.',
    'sports_gymnastics',
    500
  ),
  (
    'squat_100',
    'Squat 100kg',
    'Squatted 100kg. Grounded power.',
    'fitness_center',
    750
  ),
  (
    'goal_achieved',
    'Goal Achieved',
    'Reached your primary target weight goal. The master artisan has crafted a masterpiece.',
    'emoji_events',
    1000
  )
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    icon        = EXCLUDED.icon,
    xp_reward   = EXCLUDED.xp_reward;


-- ────────────────────────────────────────────────────────────
-- 4. TRIGGERS
-- ────────────────────────────────────────────────────────────

-- ── 4A. Auto-update profiles.updated_at on every UPDATE ─────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ── 4B. Auto-create a profile row when a new user signs up ──
--        This fires on INSERT into auth.users (i.e. sign-up).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER           -- runs as superuser to bypass RLS
SET search_path = public   -- hardened: prevent search_path hijack
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        name,
        age,
        height,
        current_weight,
        goal_weight,
        diet_type,
        theme,
        xp,
        level,
        streak,
        max_streak,
        main_goal,
        activity_level,
        workout_preference,
        experience_level,
        is_onboarded,
        start_date,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        0,
        0,
        0,
        0,
        'General',
        'FORGE',
        0,
        0,
        0,
        0,
        '',
        '',
        '',
        '',
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;   -- idempotent: safe if row already exists

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────

-- Enable RLS on every user-data table
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements  ENABLE ROW LEVEL SECURITY;

-- ── 5.1  profiles ────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: select own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"  ON public.profiles;

CREATE POLICY "profiles: select own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Allow the trigger (SECURITY DEFINER) to insert,
-- AND allow the client to also insert during onboarding fall-back.
CREATE POLICY "profiles: insert own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ── 5.2  workouts ────────────────────────────────────────────
DROP POLICY IF EXISTS "workouts: all own" ON public.workouts;
CREATE POLICY "workouts: all own"
    ON public.workouts FOR ALL
    USING      (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- ── 5.3  exercises  (join-checked through workouts) ──────────
DROP POLICY IF EXISTS "exercises: all own" ON public.exercises;
CREATE POLICY "exercises: all own"
    ON public.exercises FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workouts w
            WHERE w.id = exercises.workout_id
              AND w.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workouts w
            WHERE w.id = exercises.workout_id
              AND w.profile_id = auth.uid()
        )
    );

-- ── 5.4  workout_sessions ────────────────────────────────────
DROP POLICY IF EXISTS "workout_sessions: all own" ON public.workout_sessions;
CREATE POLICY "workout_sessions: all own"
    ON public.workout_sessions FOR ALL
    USING      (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- ── 5.5  workout_sets  (join-checked through sessions) ───────
DROP POLICY IF EXISTS "workout_sets: all own" ON public.workout_sets;
CREATE POLICY "workout_sets: all own"
    ON public.workout_sets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_sets.session_id
              AND s.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_sets.session_id
              AND s.profile_id = auth.uid()
        )
    );

-- ── 5.6  nutrition_logs ──────────────────────────────────────
DROP POLICY IF EXISTS "nutrition_logs: all own" ON public.nutrition_logs;
CREATE POLICY "nutrition_logs: all own"
    ON public.nutrition_logs FOR ALL
    USING      (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- ── 5.7  weight_logs ─────────────────────────────────────────
DROP POLICY IF EXISTS "weight_logs: all own" ON public.weight_logs;
CREATE POLICY "weight_logs: all own"
    ON public.weight_logs FOR ALL
    USING      (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- ── 5.8  progress_photos ─────────────────────────────────────
DROP POLICY IF EXISTS "progress_photos: all own" ON public.progress_photos;
CREATE POLICY "progress_photos: all own"
    ON public.progress_photos FOR ALL
    USING      (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- ── 5.9  achievements  (public read-only catalogue) ──────────
DROP POLICY IF EXISTS "achievements: public read" ON public.achievements;
CREATE POLICY "achievements: public read"
    ON public.achievements FOR SELECT
    USING (true);

-- ── 5.10  user_achievements ──────────────────────────────────
DROP POLICY IF EXISTS "user_achievements: all own" ON public.user_achievements;
CREATE POLICY "user_achievements: all own"
    ON public.user_achievements FOR ALL
    USING      (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);


-- ────────────────────────────────────────────────────────────
-- 6. STORAGE: progress-photos bucket
-- ────────────────────────────────────────────────────────────

-- Create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'progress-photos',
    'progress-photos',
    true,
    10485760,               -- 10 MB per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies before recreating (safe re-run)
DROP POLICY IF EXISTS "progress-photos: public read"   ON storage.objects;
DROP POLICY IF EXISTS "progress-photos: user insert"   ON storage.objects;
DROP POLICY IF EXISTS "progress-photos: user manage"   ON storage.objects;

-- Allow anyone to read photos (they're keyed under user UUID anyway)
CREATE POLICY "progress-photos: public read"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'progress-photos');

-- Users can only upload into their own subfolder  (uid/filename)
CREATE POLICY "progress-photos: user insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'progress-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update/delete only their own files
CREATE POLICY "progress-photos: user manage"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'progress-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ────────────────────────────────────────────────────────────
-- 7. GRANT EXECUTE on trigger functions to postgres role
--    (needed in some Supabase project configs)
-- ────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.handle_new_user()   TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO postgres;


-- ============================================================
--  DONE.
--  After running this file:
--    1. New sign-ups will auto-create a profiles row.
--    2. All tables are protected by RLS — users can only
--       read/write their own data.
--    3. The achievements catalogue is pre-seeded (7 entries).
--    4. The progress-photos storage bucket is ready.
--    5. Indexes are in place for all common query patterns.
-- ============================================================
