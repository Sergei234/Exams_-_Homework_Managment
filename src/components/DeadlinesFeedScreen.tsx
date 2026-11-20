import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flame,
  Paperclip,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';
import { formatDayTime, formatTimeLeft, getSafeBufferTargetIso } from '../lib/dateUtils';
import type { Assignment } from '../types/tempo';

interface DeadlinesFeedScreenProps {
  assignments: Assignment[];
  onOpenAssignment: (assignmentId: string) => void;
  onStartMilestone: (assignment: Assignment) => void;
  onToggleComplete: (assignment: Assignment) => void;
  onOpenSquad: () => void;
  onOpenQuickAdd: () => void;
}

type FeedFilter = 'critical' | 'exams' | 'homework' | 'all';

export function DeadlinesFeedScreen({
  assignments,
  onOpenAssignment,
  onStartMilestone,
  onToggleComplete,
  onOpenSquad,
  onOpenQuickAdd,
}: DeadlinesFeedScreenProps) {
  const [filter, setFilter] = useState<FeedFilter>('all');

  const activeAssignments = useMemo(
    () =>
      assignments
        .filter((a) => a.status === 'active')
        .sort(
          (a, b) =>
            new Date(a.hard_deadline).getTime() - new Date(b.hard_deadline).getTime(),
        ),
    [assignments],
  );

  const counts = useMemo(
    () => ({
      all: activeAssignments.length,
      critical: activeAssignments.filter((a) => a.is_critical).length,
      exams: activeAssignments.filter((a) => a.deliverable_type === 'exam').length,
      homework: activeAssignments.filter(
        (a) => a.deliverable_type === 'homework' || a.deliverable_type === 'paper',
      ).length,
    }),
    [activeAssignments],
  );

  const filtered = useMemo(() => {
    if (filter === 'critical') return activeAssignments.filter((a) => a.is_critical);
    if (filter === 'exams')
      return activeAssignments.filter((a) => a.deliverable_type === 'exam');
    if (filter === 'homework')
      return activeAssignments.filter(
        (a) => a.deliverable_type === 'homework' || a.deliverable_type === 'paper',
      );
    return activeAssignments;
  }, [activeAssignments, filter]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const completedBuffersCount = assignments.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Priority Radar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Today&apos;s Focus
          </p>
          <div className="flex items-baseline gap-3 mt-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {todayFormatted}
            </h1>
            <span className="text-xs font-semibold text-[#F95738] tabular-nums">
              · {activeAssignments.length} on deck
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSquad}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-100 text-xs font-medium text-slate-700 flex items-center gap-2 transition-colors"
          >
            <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate max-w-[230px] sm:max-w-none">
              <strong className="font-semibold text-indigo-700">78%</strong> of Linear Algebra squad finished Milestone 1
            </span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Filter deadlines"
        >
          {(
            [
              { id: 'all', label: `All (${counts.all})`, icon: Target },
              { id: 'critical', label: `Critical (${counts.critical})`, icon: Flame },
              { id: 'exams', label: `Exams (${counts.exams})`, icon: Award },
              { id: 'homework', label: `Homework (${counts.homework})`, icon: FileText },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="hidden lg:inline-flex min-h-[40px] px-4 py-2 rounded-xl bg-[#F95738] hover:bg-[#e1492b] text-white text-xs font-semibold items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <span>+ Quick Add Task</span>
        </button>
      </div>

      {/* Deadline Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 mb-1">
            All caught up in this category
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Zero overdue deliverables. Add a new syllabus task or switch filters to review upcoming buffers.
          </p>
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Add Task or Exam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const milestones = item.milestones ?? [];
            const completedSteps = milestones.filter((m) => m.is_completed).length;
            const totalSteps = milestones.length;
            const nextStep = milestones.find((m) => !m.is_completed);
            const progressPct =
              totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
            const bufferTargetIso = getSafeBufferTargetIso(
              item.hard_deadline,
              item.safe_buffer_hours,
            );
            const isExam = item.deliverable_type === 'exam';
            const isReading = item.deliverable_type === 'reading';

            return (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between gap-4 hover:border-indigo-200 transition-colors"
              >
                <div>
                  {/* Clean unboxed metadata kicker */}
                  <div className="flex items-center justify-between gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1.5 text-slate-600 font-semibold truncate">
                      <span className={isExam ? 'text-[#F95738]' : 'text-indigo-700'}>
                        {item.course_code}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{item.grade_weight_pct}% of Grade</span>
                    </div>

                    <span
                      className={`font-mono text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                        item.is_critical ? 'text-[#F95738]' : 'text-emerald-700'
                      }`}
                    >
                      {formatTimeLeft(item.hard_deadline)}
                    </span>
                  </div>

                  {/* Clickable Title & Description */}
                  <button
                    type="button"
                    onClick={() => onOpenAssignment(item.id)}
                    className="text-left group w-full"
                  >
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </button>
                </div>

                {/* Middle Progress / Safe-Buffer Block */}
                {isExam && totalSteps > 0 ? (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-800 mb-2">
                      <span className="truncate">
                        Milestone {Math.min(completedSteps + 1, totalSteps)} of {totalSteps}:{' '}
                        {nextStep ? nextStep.title : 'Ready for Exam'}
                      </span>
                      <span className="font-mono text-indigo-700 tabular-nums shrink-0">
                        {progressPct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(8, progressPct)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        Est. {Math.round((item.estimated_minutes / 60) * 10) / 10}h remaining
                      </span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {completedSteps} of {totalSteps} Done
                      </span>
                    </div>
                  </div>
                ) : !isReading ? (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70">
                    <div className="flex items-center justify-between gap-2 text-xs mb-2">
                      <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Buffer Goal: {formatDayTime(bufferTargetIso)}
                      </span>
                      <span className="font-medium text-rose-600 tabular-nums">
                        Hard Due: {formatDayTime(item.hard_deadline)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-emerald-600 rounded-full w-3/4" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="tabular-nums">
                        {item.safe_buffer_hours}h ahead of hard deadline
                      </span>
                      <span className="text-indigo-700 font-medium tabular-nums">
                        14 squad submitted
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-600 py-1">
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Est. {item.estimated_minutes} min · 1 Pomodoro
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenAssignment(item.id)}
                      className="text-indigo-600 font-semibold inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Open Guide</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {isExam ? (
                      <>
                        <div className="flex -space-x-1.5">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            AK
                          </span>
                          <span className="w-6 h-6 rounded-full bg-[#F95738] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            MR
                          </span>
                        </div>
                        <span className="tabular-nums">+18 prep buddies</span>
                      </>
                    ) : isReading ? (
                      <button
                        type="button"
                        onClick={() => onToggleComplete(item)}
                        className="min-h-[40px] inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-emerald-700"
                      >
                        <span className="w-5 h-5 rounded-full border-2 border-indigo-400 flex items-center justify-center">
                          <Check className="w-3 h-3 opacity-0" />
                        </span>
                        <span>Mark Reading Complete</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{nextStep ? nextStep.title : 'Ready to submit'}</span>
                      </span>
                    )}
                  </div>

                  {isExam ? (
                    <button
                      type="button"
                      onClick={() => onStartMilestone(item)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F95738] hover:bg-[#e1492b] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Start Milestone</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenAssignment(item.id)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{isReading ? 'Details' : 'View Prompts'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Bottom Buffer Celebration Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            You&apos;re {Math.max(2, completedBuffersCount)} buffer-milestones ahead!
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Zero last-minute all-nighters logged this week. Safe-Zone consistency keeps your GPA protected.
          </p>
        </div>
      </div>
    </div>
  );
}
