-- Tempo Academic Deadline & Study Planner — Supabase Schema
-- Run this script in your Supabase Dashboard -> SQL Editor to provision all tables,
-- RLS policies, Realtime publications, and initial academic seed data.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Student Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL DEFAULT 'Aibek Nurmatov',
  major TEXT NOT NULL DEFAULT 'Applied Mathematics & CS',
  year_label TEXT NOT NULL DEFAULT 'Year 3',
  university TEXT NOT NULL DEFAULT 'State University',
  faculty TEXT NOT NULL DEFAULT 'Faculty of Sciences',
  tier_label TEXT NOT NULL DEFAULT 'Dean''s List Pacesetter',
  reliability_score INTEGER NOT NULL DEFAULT 98,
  deadlines_met INTEGER NOT NULL DEFAULT 36,
  late_penalties INTEGER NOT NULL DEFAULT 0,
  avg_safe_buffer_hours NUMERIC(5,1) NOT NULL DEFAULT 16.2,
  streak_days INTEGER NOT NULL DEFAULT 28,
  cohort_rank INTEGER NOT NULL DEFAULT 12,
  cohort_percentile INTEGER NOT NULL DEFAULT 3,
  avatar_url TEXT NOT NULL DEFAULT '/src/assets/images/student_avatar_aibek_1795159903775.jpg',
  lms_provider TEXT NOT NULL DEFAULT 'Canvas',
  lms_connected BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  semester TEXT NOT NULL DEFAULT 'Fall Semester',
  instructor TEXT NOT NULL DEFAULT 'Faculty Staff',
  color_token TEXT NOT NULL DEFAULT 'indigo',
  prep_buddies_count INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Assignments & Exams
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  deliverable_type TEXT NOT NULL DEFAULT 'homework' CHECK (deliverable_type IN ('homework', 'exam', 'paper', 'reading')),
  grade_weight_pct INTEGER NOT NULL DEFAULT 15,
  estimated_minutes INTEGER NOT NULL DEFAULT 90,
  hard_deadline TIMESTAMPTZ NOT NULL,
  safe_buffer_hours INTEGER NOT NULL DEFAULT 24,
  safe_buffer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  submitted_early_hours NUMERIC(5,1) DEFAULT 0,
  instructor_notes TEXT NOT NULL DEFAULT '',
  lms_source_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Study Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  est_minutes INTEGER NOT NULL DEFAULT 30,
  target_label TEXT NOT NULL DEFAULT 'Recommended Next Block',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- 5. Study Sprints
CREATE TABLE IF NOT EXISTS public.study_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  room_details TEXT NOT NULL,
  time_window TEXT NOT NULL,
  sprint_date_label TEXT NOT NULL DEFAULT 'Today',
  prep_progress_pct INTEGER NOT NULL DEFAULT 72,
  focused_mates_count INTEGER NOT NULL DEFAULT 3,
  is_confirmed_by_user BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Sprint Attendees
CREATE TABLE IF NOT EXISTS public.sprint_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.study_sprints(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT 'indigo',
  confirmed BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. Squad Chat Messages
CREATE TABLE IF NOT EXISTS public.squad_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.study_sprints(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_initials TEXT NOT NULL,
  sender_color TEXT NOT NULL DEFAULT 'indigo',
  is_self BOOLEAN NOT NULL DEFAULT FALSE,
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'milestone_event', 'schedule_suggestion')),
  content TEXT NOT NULL,
  read_by_count INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Focus Sessions (Pomodoro / Deep Work Logs)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Accountability Badges
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_key TEXT NOT NULL DEFAULT 'shield',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Squad Endorsements
CREATE TABLE IF NOT EXISTS public.endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT NOT NULL,
  quote TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions for anon & authenticated clients
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Enable Row Level Security with permissive workspace access
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'student_profiles', 'courses', 'assignments', 'milestones',
    'study_sprints', 'sprint_attendees', 'squad_messages',
    'focus_sessions', 'badges', 'endorsements'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow full tempo access" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "Allow full tempo access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

-- Enable Supabase Realtime on live collaboration tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sprints;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
