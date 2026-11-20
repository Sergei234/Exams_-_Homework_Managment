import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Clock,
  GraduationCap,
  Hourglass,
  Plus,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { AssignmentDetailScreen } from './components/AssignmentDetailScreen';
import { CoursesScreen } from './components/CoursesScreen';
import { DeadlinesFeedScreen } from './components/DeadlinesFeedScreen';
import { FocusTimerModal } from './components/FocusTimerModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { OnboardingScreen } from './components/OnboardingScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { QuickAddScreen } from './components/QuickAddScreen';
import { StudySquadScreen } from './components/StudySquadScreen';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { AIBEK_AVATAR_IMAGE, createInitialTempoState, PROFILE_ID, SPRINT_ID } from './lib/seedData';
import { supabase } from './lib/supabase';
import {
  buildAssignmentRecord,
  createAssignmentInDb,
  createCourseInDb,
  hydrateTempoFromSupabase,
  logFocusSessionInDb,
  persistOnboardingProfile,
  saveCachedState,
  sendSquadMessageInDb,
  subscribeToTempoRealtime,
  toggleMilestoneInDb,
  updateAssignmentInDb,
  updateStudySprintInDb,
  type CreateAssignmentInput,
} from './lib/tempoDb';
import type {
  AppScreen,
  Assignment,
  Course,
  FocusSession,
  Milestone,
  SquadMessage,
  StudentProfile,
  StudySprint,
  TempoState,
} from './types/tempo';

const SCREEN_TITLES: Record<AppScreen, string> = {
  onboarding: 'Academic Setup',
  deadlines: 'Deadlines',
  courses: 'Courses',
  detail: 'Assignment Detail',
  'quick-add': 'Quick Add',
  squad: 'Study Squad Chat',
  profile: 'Student Profile & Reliability',
};

export default function App() {
  const [state, setState] = useState<TempoState>(() => createInitialTempoState());
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('deadlines');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    'a1000000-0000-4000-8000-000000000001',
  );
  const [quickAddPrefill, setQuickAddPrefill] = useState<{
    title?: string;
    courseCode?: string;
  }>({});
  const [focusContext, setFocusContext] = useState<{
    assignment: Assignment;
    milestone?: Milestone;
  } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const refreshFromSupabase = useCallback(async () => {
    const hydrated = await hydrateTempoFromSupabase();
    setState(hydrated);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshFromSupabase();

    void supabase.auth.getSession().then(({ data }) => {
      setAuthEmail(data.session?.user?.email ?? null);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user?.email ?? null);
    });

    const unsubscribeRealtime = subscribeToTempoRealtime(() => {
      void refreshFromSupabase();
    });

    return () => {
      authSub.subscription.unsubscribe();
      unsubscribeRealtime();
    };
  }, [refreshFromSupabase]);

  const commitState = useCallback((updater: (prev: TempoState) => TempoState) => {
    setState((prev) => {
      const next = updater(prev);
      saveCachedState(next);
      return next;
    });
  }, []);

  const selectedAssignment = useMemo(
    () =>
      state.assignments.find((a) => a.id === selectedAssignmentId) ??
      state.assignments[0],
    [state.assignments, selectedAssignmentId],
  );

  const primarySprint = state.sprints[0];

  const handleOpenAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setScreen('detail');
  };

  const handleCompleteOnboarding = async (patch: Partial<StudentProfile>) => {
    commitState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
    await persistOnboardingProfile(patch);
    setScreen('deadlines');
    showToast(`Semester synced with ${patch.lms_provider ?? 'Canvas'}!`);
  };

  const handleCreateCourse = async (
    code: string,
    name: string,
    instructor = 'Faculty Staff',
  ): Promise<Course> => {
    const newCourse: Course = {
      id: crypto.randomUUID(),
      user_id: PROFILE_ID,
      code,
      name,
      semester: 'Fall Semester',
      instructor,
      color_token: 'indigo',
      prep_buddies_count: 8,
      created_at: new Date().toISOString(),
    };
    commitState((prev) => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }));
    await createCourseInDb(newCourse);
    showToast(`Added ${newCourse.code} to courses`);
    return newCourse;
  };

  const handleSaveAssignment = async (input: CreateAssignmentInput) => {
    const created = buildAssignmentRecord(input);
    commitState((prev) => ({
      ...prev,
      assignments: [created, ...prev.assignments],
    }));
    await createAssignmentInDb(created);
    setSelectedAssignmentId(created.id);
    setQuickAddPrefill({});
    setScreen('deadlines');
    showToast(
      `Locked in ${created.course_code} with ${created.safe_buffer_hours}h safe buffer`,
    );
  };

  const handleToggleStar = async (assignment: Assignment) => {
    const nextStarred = !assignment.is_starred;
    commitState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === assignment.id ? { ...a, is_starred: nextStarred } : a,
      ),
    }));
    await updateAssignmentInDb(assignment.id, { is_starred: nextStarred });
  };

  const handleToggleMilestone = async (assignment: Assignment, milestone: Milestone) => {
    const nextCompleted = !milestone.is_completed;
    commitState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => {
        if (a.id !== assignment.id) return a;
        return {
          ...a,
          milestones: (a.milestones ?? []).map((m) =>
            m.id === milestone.id
              ? {
                  ...m,
                  is_completed: nextCompleted,
                  target_label: nextCompleted ? 'Done just now' : 'Recommended Next Block',
                }
              : m,
          ),
        };
      }),
    }));
    await toggleMilestoneInDb(milestone.id, nextCompleted);

    if (nextCompleted) {
      const eventMsg: SquadMessage = {
        id: crypto.randomUUID(),
        sprint_id: SPRINT_ID,
        sender_name: 'Tempo System',
        sender_initials: 'TM',
        sender_color: 'bg-indigo-100 text-indigo-700',
        is_self: false,
        message_type: 'milestone_event',
        content: `You finished "${milestone.title}" for ${assignment.course_code}`,
        read_by_count: 4,
        created_at: new Date().toISOString(),
      };
      commitState((prev) => ({
        ...prev,
        messages: [...prev.messages, eventMsg],
      }));
      await sendSquadMessageInDb(eventMsg);
      showToast('Milestone completed & synced!');
    }
  };

  const handleToggleCompleteAssignment = async (assignment: Assignment) => {
    const nextStatus = assignment.status === 'completed' ? 'active' : 'completed';
    const submittedAt = nextStatus === 'completed' ? new Date().toISOString() : null;
    const earlyHours =
      nextStatus === 'completed'
        ? Math.max(
            1,
            Math.round(
              (new Date(assignment.hard_deadline).getTime() - Date.now()) / 3600000,
            ),
          )
        : 0;

    commitState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === assignment.id
          ? {
              ...a,
              status: nextStatus,
              submitted_at: submittedAt,
              submitted_early_hours: earlyHours,
            }
          : a,
      ),
      profile: {
        ...prev.profile,
        deadlines_met:
          nextStatus === 'completed'
            ? prev.profile.deadlines_met + 1
            : Math.max(0, prev.profile.deadlines_met - 1),
      },
    }));
    await updateAssignmentInDb(assignment.id, {
      status: nextStatus,
      submitted_at: submittedAt,
      submitted_early_hours: earlyHours,
    });
    showToast(
      nextStatus === 'completed'
        ? 'Submitted early & archived in Completed Vault!'
        : 'Restored to active Deadlines feed',
    );
  };

  const handleStartFocusBlock = (assignment: Assignment, milestone?: Milestone) => {
    setFocusContext({ assignment, milestone });
  };

  const handleCompleteFocusSession = async (durationMinutes: number) => {
    if (!focusContext) return;
    const session: FocusSession = {
      id: crypto.randomUUID(),
      user_id: PROFILE_ID,
      assignment_id: focusContext.assignment.id,
      milestone_id: focusContext.milestone?.id ?? null,
      duration_minutes: durationMinutes,
      completed_at: new Date().toISOString(),
    };
    commitState((prev) => ({
      ...prev,
      focusSessions: [session, ...prev.focusSessions],
      profile: {
        ...prev.profile,
        reliability_score: Math.min(100, prev.profile.reliability_score),
      },
    }));
    await logFocusSessionInDb(session);
    showToast(`Logged ${durationMinutes}m focus block for ${focusContext.assignment.course_code}`);
  };

  const handleToggleSeatConfirm = async (sprint: StudySprint) => {
    const nextConfirmed = !sprint.is_confirmed_by_user;
    commitState((prev) => ({
      ...prev,
      sprints: prev.sprints.map((s) =>
        s.id === sprint.id ? { ...s, is_confirmed_by_user: nextConfirmed } : s,
      ),
      attendees: prev.attendees.map((a) =>
        a.display_name === 'You' ? { ...a, confirmed: nextConfirmed } : a,
      ),
    }));
    await updateStudySprintInDb(sprint.id, { is_confirmed_by_user: nextConfirmed });
    showToast(nextConfirmed ? 'Seat confirmed for Study Sprint!' : 'Seat RSVP paused');
  };

  const handleSuggestSprintTime = async (
    sprint: StudySprint,
    timeWindow: string,
    location: string,
  ) => {
    commitState((prev) => ({
      ...prev,
      sprints: prev.sprints.map((s) =>
        s.id === sprint.id ? { ...s, time_window: timeWindow, location } : s,
      ),
    }));
    await updateStudySprintInDb(sprint.id, { time_window: timeWindow, location });

    const noticeMsg: SquadMessage = {
      id: crypto.randomUUID(),
      sprint_id: sprint.id,
      sender_name: 'Tempo System',
      sender_initials: 'TM',
      sender_color: 'bg-indigo-100 text-indigo-700',
      is_self: false,
      message_type: 'schedule_suggestion',
      content: `You updated sprint time to ${timeWindow} at ${location}`,
      read_by_count: 4,
      created_at: new Date().toISOString(),
    };
    commitState((prev) => ({
      ...prev,
      messages: [...prev.messages, noticeMsg],
    }));
    await sendSquadMessageInDb(noticeMsg);
    showToast('Updated sprint schedule & notified squad');
  };

  const handleSendSquadMessage = async (content: string) => {
    const msg: SquadMessage = {
      id: crypto.randomUUID(),
      sprint_id: SPRINT_ID,
      sender_name: 'You',
      sender_initials: 'AI',
      sender_color: 'bg-indigo-600 text-white',
      is_self: true,
      message_type: 'chat',
      content,
      read_by_count: 3,
      created_at: new Date().toISOString(),
    };
    commitState((prev) => ({
      ...prev,
      messages: [...prev.messages, msg],
    }));
    await sendSquadMessageInDb(msg);
  };

  const activeDeadlinesCount = state.assignments.filter((a) => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/80 p-5 justify-between z-30">
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setScreen('deadlines')}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Hourglass className="w-5 h-5" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
              Tempo
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQuickAddPrefill({});
              setScreen('quick-add');
            }}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#F95738] hover:bg-[#e1492b] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#F95738]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add Task</span>
          </button>

          <nav className="space-y-1" aria-label="Primary navigation">
            {(
              [
                { id: 'deadlines', label: 'Deadlines', icon: Clock, count: activeDeadlinesCount },
                { id: 'courses', label: 'Courses', icon: GraduationCap, count: state.courses.length },
                { id: 'squad', label: 'Study Squad', icon: Users },
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'onboarding', label: 'Academic Setup', icon: Sparkles },
              ] as const
            ).map((nav) => {
              const Icon = nav.icon;
              const active =
                screen === nav.id || (nav.id === 'deadlines' && screen === 'detail');
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => setScreen(nav.id)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{nav.label}</span>
                  </span>
                  {'count' in nav && typeof nav.count === 'number' && (
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {nav.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setScreen('profile')}
          className="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-colors text-left"
        >
          <img
            src={state.profile.avatar_url || AIBEK_AVATAR_IMAGE}
            alt={state.profile.full_name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {state.profile.full_name}
            </p>
            <p className="font-mono text-[11px] font-semibold text-indigo-700 tabular-nums">
              Reliability {state.profile.reliability_score}/100
            </p>
          </div>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Compact Top App Bar (<= 56px) */}
        <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setScreen('deadlines')}
              className="lg:hidden font-display text-base font-extrabold text-slate-900 whitespace-nowrap shrink-0"
            >
              Tempo
            </button>
            <span className="lg:hidden text-slate-300" aria-hidden="true">/</span>
            <span className="text-sm font-semibold text-indigo-700 truncate">
              {SCREEN_TITLES[screen]}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              aria-label="Open priority alerts"
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {activeDeadlinesCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#F95738]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setScreen('profile')}
              aria-label="Open student profile"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
            >
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                <User className="w-4 h-4" />
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable Screen Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 pb-24 lg:pb-10">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading your Tempo academic workspace...
            </div>
          ) : screen === 'onboarding' ? (
            <OnboardingScreen
              profile={state.profile}
              onCompleteOnboarding={handleCompleteOnboarding}
              onScanToQuickAdd={(prefillTitle, prefillCourseCode) => {
                setQuickAddPrefill({ title: prefillTitle, courseCode: prefillCourseCode });
                setScreen('quick-add');
              }}
            />
          ) : screen === 'deadlines' ? (
            <DeadlinesFeedScreen
              assignments={state.assignments}
              onOpenAssignment={handleOpenAssignment}
              onStartMilestone={(assignment) => {
                const nextM = (assignment.milestones ?? []).find((m) => !m.is_completed);
                handleStartFocusBlock(assignment, nextM);
              }}
              onToggleComplete={handleToggleCompleteAssignment}
              onOpenSquad={() => setScreen('squad')}
              onOpenQuickAdd={() => {
                setQuickAddPrefill({});
                setScreen('quick-add');
              }}
            />
          ) : screen === 'courses' ? (
            <CoursesScreen
              courses={state.courses}
              assignments={state.assignments}
              onCreateCourse={handleCreateCourse}
              onOpenAssignment={handleOpenAssignment}
              onOpenQuickAddForCourse={(courseCode) => {
                setQuickAddPrefill({ courseCode });
                setScreen('quick-add');
              }}
            />
          ) : screen === 'detail' && selectedAssignment ? (
            <AssignmentDetailScreen
              assignment={selectedAssignment}
              onBack={() => setScreen('deadlines')}
              onToggleStar={handleToggleStar}
              onToggleMilestone={handleToggleMilestone}
              onToggleCompleteAssignment={handleToggleCompleteAssignment}
              onStartFocusBlock={handleStartFocusBlock}
              onOpenSquad={() => setScreen('squad')}
            />
          ) : screen === 'quick-add' ? (
            <QuickAddScreen
              courses={state.courses}
              prefillTitle={quickAddPrefill.title}
              prefillCourseCode={quickAddPrefill.courseCode}
              onCancel={() => setScreen('deadlines')}
              onCreateCourse={handleCreateCourse}
              onSaveAssignment={handleSaveAssignment}
            />
          ) : screen === 'squad' && primarySprint ? (
            <StudySquadScreen
              sprint={primarySprint}
              attendees={state.attendees}
              messages={state.messages}
              onToggleSeatConfirm={handleToggleSeatConfirm}
              onSuggestTime={handleSuggestSprintTime}
              onSendMessage={handleSendSquadMessage}
            />
          ) : (
            <ProfileScreen
              profile={state.profile}
              assignments={state.assignments}
              focusSessions={state.focusSessions}
              badges={state.badges}
              endorsements={state.endorsements}
              supabaseConnected={state.supabaseConnected}
              onOpenAssignment={handleOpenAssignment}
              onOpenOnboardingSetup={() => setScreen('onboarding')}
              onOpenSupabaseModal={() => setShowSupabaseModal(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 pb-safe bg-white/95 backdrop-blur-md border-t border-slate-200/90 grid grid-cols-5 items-center px-2"
        aria-label="Mobile bottom navigation"
      >
        <button
          type="button"
          onClick={() => setScreen('deadlines')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            screen === 'deadlines' || screen === 'detail'
              ? 'text-indigo-600'
              : 'text-slate-500'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Deadlines</span>
        </button>

        <button
          type="button"
          onClick={() => setScreen('courses')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            screen === 'courses' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Courses</span>
        </button>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              setQuickAddPrefill({});
              setScreen('quick-add');
            }}
            aria-label="Quick add task or exam"
            className="-mt-6 w-12 h-12 rounded-full bg-[#F95738] hover:bg-[#e1492b] text-white shadow-lg shadow-[#F95738]/30 flex items-center justify-center transition-transform active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setScreen('squad')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            screen === 'squad' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Study Squad</span>
        </button>

        <button
          type="button"
          onClick={() => setScreen('profile')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            screen === 'profile' || screen === 'onboarding'
              ? 'text-indigo-600'
              : 'text-slate-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Profile</span>
        </button>
      </nav>

      {/* Modals & Drawers */}
      {focusContext && (
        <FocusTimerModal
          assignment={focusContext.assignment}
          milestone={focusContext.milestone}
          onClose={() => setFocusContext(null)}
          onCompleteSession={handleCompleteFocusSession}
        />
      )}

      {showNotifications && (
        <NotificationDrawer
          assignments={state.assignments}
          messages={state.messages}
          onClose={() => setShowNotifications(false)}
          onSelectAssignment={handleOpenAssignment}
          onOpenSquad={() => setScreen('squad')}
        />
      )}

      {showSupabaseModal && (
        <SupabaseSyncModal
          connected={state.supabaseConnected}
          notice={state.supabaseNotice}
          userEmail={authEmail}
          onClose={() => setShowSupabaseModal(false)}
          onRefreshFromSupabase={refreshFromSupabase}
        />
      )}

      {/* Subtle Action Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
