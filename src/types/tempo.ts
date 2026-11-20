export type DeliverableType = 'homework' | 'exam' | 'paper' | 'reading';
export type AssignmentStatus = 'active' | 'completed';
export type SquadMessageType = 'chat' | 'milestone_event' | 'schedule_suggestion';
export type AppScreen =
  | 'onboarding'
  | 'deadlines'
  | 'courses'
  | 'detail'
  | 'quick-add'
  | 'squad'
  | 'profile';

export interface StudentProfile {
  id: string;
  full_name: string;
  major: string;
  year_label: string;
  university: string;
  faculty: string;
  tier_label: string;
  reliability_score: number;
  deadlines_met: number;
  late_penalties: number;
  avg_safe_buffer_hours: number;
  streak_days: number;
  cohort_rank: number;
  cohort_percentile: number;
  avatar_url: string;
  lms_provider: string;
  lms_connected: boolean;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  user_id?: string | null;
  code: string;
  name: string;
  semester: string;
  instructor: string;
  color_token: 'indigo' | 'coral' | 'emerald' | 'amber' | 'slate';
  prep_buddies_count: number;
  created_at?: string;
}

export interface Milestone {
  id: string;
  assignment_id: string;
  step_number: number;
  title: string;
  est_minutes: number;
  target_label: string;
  is_completed: boolean;
  completed_at?: string | null;
}

export interface Assignment {
  id: string;
  user_id?: string | null;
  course_id?: string | null;
  course_code: string;
  course_name: string;
  title: string;
  description: string;
  deliverable_type: DeliverableType;
  grade_weight_pct: number;
  estimated_minutes: number;
  hard_deadline: string;
  safe_buffer_hours: number;
  safe_buffer_enabled: boolean;
  status: AssignmentStatus;
  is_critical: boolean;
  is_starred: boolean;
  submitted_at?: string | null;
  submitted_early_hours?: number | null;
  instructor_notes: string;
  lms_source_url?: string | null;
  created_at?: string;
  milestones?: Milestone[];
}

export interface StudySprint {
  id: string;
  course_code: string;
  title: string;
  location: string;
  room_details: string;
  time_window: string;
  sprint_date_label: string;
  prep_progress_pct: number;
  focused_mates_count: number;
  is_confirmed_by_user: boolean;
  created_at?: string;
}

export interface SprintAttendee {
  id: string;
  sprint_id: string;
  display_name: string;
  initials: string;
  avatar_color: string;
  confirmed: boolean;
}

export interface SquadMessage {
  id: string;
  sprint_id: string;
  sender_name: string;
  sender_initials: string;
  sender_color: string;
  is_self: boolean;
  message_type: SquadMessageType;
  content: string;
  read_by_count: number;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id?: string | null;
  assignment_id?: string | null;
  milestone_id?: string | null;
  duration_minutes: number;
  completed_at: string;
}

export interface Badge {
  id: string;
  user_id?: string | null;
  title: string;
  description: string;
  icon_key: 'shield' | 'bolt' | 'handshake' | 'award';
  earned_at: string;
}

export interface Endorsement {
  id: string;
  user_id?: string | null;
  author_name: string;
  author_avatar_url: string;
  quote: string;
  is_verified: boolean;
  created_at: string;
}

export interface TempoState {
  profile: StudentProfile;
  courses: Course[];
  assignments: Assignment[];
  sprints: StudySprint[];
  attendees: SprintAttendee[];
  messages: SquadMessage[];
  focusSessions: FocusSession[];
  badges: Badge[];
  endorsements: Endorsement[];
  supabaseConnected: boolean;
  supabaseNotice: string | null;
}
