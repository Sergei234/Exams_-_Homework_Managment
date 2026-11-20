import { supabase } from './supabase';
import { createInitialTempoState, PROFILE_ID, SPRINT_ID } from './seedData';
import type {
  Assignment,
  Course,
  DeliverableType,
  FocusSession,
  Milestone,
  SquadMessage,
  StudentProfile,
  StudySprint,
  TempoState,
} from '../types/tempo';

const STORAGE_KEY = 'tempo_academic_planner_v1';

function loadCachedState(): TempoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialTempoState();
    const parsed = JSON.parse(raw) as TempoState;
    if (!parsed || !parsed.profile || !Array.isArray(parsed.assignments)) {
      return createInitialTempoState();
    }
    return parsed;
  } catch {
    return createInitialTempoState();
  }
}

export function saveCachedState(state: TempoState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetCachedState(): TempoState {
  const fresh = createInitialTempoState();
  saveCachedState(fresh);
  return fresh;
}

export async function hydrateTempoFromSupabase(): Promise<TempoState> {
  const cached = loadCachedState();

  try {
    const [
      profileRes,
      coursesRes,
      assignmentsRes,
      milestonesRes,
      sprintsRes,
      attendeesRes,
      messagesRes,
      sessionsRes,
      badgesRes,
      endorsementsRes,
    ] = await Promise.all([
      supabase.from('student_profiles').select('*').limit(1),
      supabase.from('courses').select('*').order('created_at', { ascending: true }),
      supabase.from('assignments').select('*').order('hard_deadline', { ascending: true }),
      supabase.from('milestones').select('*').order('step_number', { ascending: true }),
      supabase.from('study_sprints').select('*').order('created_at', { ascending: true }),
      supabase.from('sprint_attendees').select('*'),
      supabase.from('squad_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('focus_sessions').select('*').order('completed_at', { ascending: false }),
      supabase.from('badges').select('*').order('earned_at', { ascending: false }),
      supabase.from('endorsements').select('*').order('created_at', { ascending: false }),
    ]);

    const anyPermOrMissingError = [
      profileRes.error,
      coursesRes.error,
      assignmentsRes.error,
      sprintsRes.error,
      messagesRes.error,
    ].find(Boolean);

    if (anyPermOrMissingError) {
      return {
        ...cached,
        supabaseConnected: false,
        supabaseNotice: anyPermOrMissingError.message,
      };
    }

    const milestonesByAssignment = new Map<string, Milestone[]>();
    for (const m of (milestonesRes.data ?? []) as Milestone[]) {
      const list = milestonesByAssignment.get(m.assignment_id) ?? [];
      list.push(m);
      milestonesByAssignment.set(m.assignment_id, list);
    }

    const liveAssignments = ((assignmentsRes.data ?? []) as Assignment[]).map((a) => ({
      ...a,
      milestones: milestonesByAssignment.get(a.id) ?? [],
    }));

    const hasLiveRows =
      (profileRes.data?.length ?? 0) > 0 ||
      liveAssignments.length > 0 ||
      (coursesRes.data?.length ?? 0) > 0;

    if (!hasLiveRows) {
      // Tables exist and are accessible, seed initial academic data into Supabase
      await seedLiveSupabaseIfEmpty(cached);
      return {
        ...cached,
        supabaseConnected: true,
        supabaseNotice: null,
      };
    }

    const nextState: TempoState = {
      profile: (profileRes.data?.[0] as StudentProfile | undefined) ?? cached.profile,
      courses:
        coursesRes.data && coursesRes.data.length > 0
          ? (coursesRes.data as Course[])
          : cached.courses,
      assignments: liveAssignments.length > 0 ? liveAssignments : cached.assignments,
      sprints:
        sprintsRes.data && sprintsRes.data.length > 0
          ? (sprintsRes.data as StudySprint[])
          : cached.sprints,
      attendees:
        attendeesRes.data && attendeesRes.data.length > 0
          ? attendeesRes.data
          : cached.attendees,
      messages:
        messagesRes.data && messagesRes.data.length > 0
          ? (messagesRes.data as SquadMessage[])
          : cached.messages,
      focusSessions:
        sessionsRes.data && sessionsRes.data.length > 0
          ? (sessionsRes.data as FocusSession[])
          : cached.focusSessions,
      badges:
        badgesRes.data && badgesRes.data.length > 0 ? badgesRes.data : cached.badges,
      endorsements:
        endorsementsRes.data && endorsementsRes.data.length > 0
          ? endorsementsRes.data
          : cached.endorsements,
      supabaseConnected: true,
      supabaseNotice: null,
    };

    saveCachedState(nextState);
    return nextState;
  } catch (err) {
    return {
      ...cached,
      supabaseConnected: false,
      supabaseNotice: err instanceof Error ? err.message : 'Unable to reach Supabase',
    };
  }
}

async function seedLiveSupabaseIfEmpty(seed: TempoState): Promise<void> {
  try {
    await supabase.from('student_profiles').upsert(seed.profile, { onConflict: 'id' });
    await supabase.from('courses').upsert(seed.courses, { onConflict: 'id' });

    const flatAssignments = seed.assignments.map(({ milestones: _m, ...rest }) => rest);
    await supabase.from('assignments').upsert(flatAssignments, { onConflict: 'id' });

    const flatMilestones = seed.assignments.flatMap((a) => a.milestones ?? []);
    if (flatMilestones.length > 0) {
      await supabase.from('milestones').upsert(flatMilestones, { onConflict: 'id' });
    }

    await supabase.from('study_sprints').upsert(seed.sprints, { onConflict: 'id' });
    await supabase.from('sprint_attendees').upsert(seed.attendees, { onConflict: 'id' });
    await supabase.from('squad_messages').upsert(seed.messages, { onConflict: 'id' });
    await supabase.from('focus_sessions').upsert(seed.focusSessions, { onConflict: 'id' });
    await supabase.from('badges').upsert(seed.badges, { onConflict: 'id' });
    await supabase.from('endorsements').upsert(seed.endorsements, { onConflict: 'id' });
  } catch {
    // Non-blocking seed best-effort
  }
}

export async function persistOnboardingProfile(
  patch: Partial<StudentProfile>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('student_profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', PROFILE_ID);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createCourseInDb(course: Course): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('courses').insert(course);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface CreateAssignmentInput {
  courseId?: string | null;
  courseCode: string;
  courseName: string;
  title: string;
  description: string;
  deliverableType: DeliverableType;
  gradeWeightPct: number;
  estimatedMinutes: number;
  hardDeadline: string;
  safeBufferHours: number;
  safeBufferEnabled: boolean;
  instructorNotes: string;
  lmsSourceUrl?: string;
  autoMilestones: string[];
}

export function buildAssignmentRecord(input: CreateAssignmentInput): Assignment {
  const assignmentId = crypto.randomUUID();
  const perStepMinutes = Math.max(
    15,
    Math.round(input.estimatedMinutes / Math.max(1, input.autoMilestones.length)),
  );
  const milestones: Milestone[] = input.autoMilestones.map((mTitle, idx) => ({
    id: crypto.randomUUID(),
    assignment_id: assignmentId,
    step_number: idx + 1,
    title: mTitle,
    est_minutes: perStepMinutes,
    target_label: idx === 0 ? 'Recommended Next Block' : `Milestone ${idx + 1}`,
    is_completed: false,
  }));

  const hoursLeft = (new Date(input.hardDeadline).getTime() - Date.now()) / 3600000;

  return {
    id: assignmentId,
    user_id: PROFILE_ID,
    course_id: input.courseId ?? null,
    course_code: input.courseCode,
    course_name: input.courseName,
    title: input.title,
    description: input.description,
    deliverable_type: input.deliverableType,
    grade_weight_pct: input.gradeWeightPct,
    estimated_minutes: input.estimatedMinutes,
    hard_deadline: input.hardDeadline,
    safe_buffer_hours: input.safeBufferHours,
    safe_buffer_enabled: input.safeBufferEnabled,
    status: 'active',
    is_critical: hoursLeft <= 72 || input.gradeWeightPct >= 20 || input.deliverableType === 'exam',
    is_starred: false,
    instructor_notes: input.instructorNotes,
    lms_source_url: input.lmsSourceUrl ?? '',
    created_at: new Date().toISOString(),
    milestones,
  };
}

export async function createAssignmentInDb(assignment: Assignment): Promise<{ ok: boolean; error?: string }> {
  const { milestones, ...row } = assignment;
  const { error } = await supabase.from('assignments').insert(row);
  if (error) return { ok: false, error: error.message };

  if (milestones && milestones.length > 0) {
    const { error: mErr } = await supabase.from('milestones').insert(milestones);
    if (mErr) return { ok: false, error: mErr.message };
  }
  return { ok: true };
}

export async function toggleMilestoneInDb(
  milestoneId: string,
  isCompleted: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('milestones')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      target_label: isCompleted ? 'Done just now' : 'Recommended Next Block',
    })
    .eq('id', milestoneId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateAssignmentInDb(
  assignmentId: string,
  patch: Partial<Omit<Assignment, 'milestones'>>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('assignments').update(patch).eq('id', assignmentId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logFocusSessionInDb(
  session: FocusSession,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('focus_sessions').insert(session);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendSquadMessageInDb(
  msg: SquadMessage,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('squad_messages').insert(msg);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateStudySprintInDb(
  sprintId: string,
  patch: Partial<StudySprint>,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('study_sprints').update(patch).eq('id', sprintId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function testSupabaseHealth(): Promise<{
  connected: boolean;
  message: string;
}> {
  const { error } = await supabase.from('assignments').select('id').limit(1);
  if (!error) {
    return {
      connected: true,
      message: 'Live Supabase sync active across all Tempo tables.',
    };
  }
  return {
    connected: false,
    message: error.message,
  };
}

export function subscribeToTempoRealtime(onRemoteChange: () => void): () => void {
  const channel = supabase
    .channel('tempo-live-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'squad_messages', filter: `sprint_id=eq.${SPRINT_ID}` },
      () => onRemoteChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'study_sprints' },
      () => onRemoteChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'assignments' },
      () => onRemoteChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'milestones' },
      () => onRemoteChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
