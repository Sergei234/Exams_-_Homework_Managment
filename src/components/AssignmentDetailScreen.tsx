import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Lock,
  MessageSquare,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
} from 'lucide-react';
import { formatDayTime, formatFullDateTime, getSafeBufferTargetIso } from '../lib/dateUtils';
import { STUDY_DESK_IMAGE } from '../lib/seedData';
import type { Assignment, Milestone } from '../types/tempo';

interface AssignmentDetailScreenProps {
  assignment: Assignment;
  onBack: () => void;
  onToggleStar: (assignment: Assignment) => void;
  onToggleMilestone: (assignment: Assignment, milestone: Milestone) => void;
  onToggleCompleteAssignment: (assignment: Assignment) => void;
  onStartFocusBlock: (assignment: Assignment, milestone?: Milestone) => void;
  onOpenSquad: () => void;
}

export function AssignmentDetailScreen({
  assignment,
  onBack,
  onToggleStar,
  onToggleMilestone,
  onToggleCompleteAssignment,
  onStartFocusBlock,
  onOpenSquad,
}: AssignmentDetailScreenProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [imgError, setImgError] = useState(false);

  const milestones = assignment.milestones ?? [];
  const completedCount = milestones.filter((m) => m.is_completed).length;
  const nextMilestone = milestones.find((m) => !m.is_completed) ?? milestones[0];
  const safeTargetIso = getSafeBufferTargetIso(
    assignment.hard_deadline,
    assignment.safe_buffer_hours,
  );

  const handleShare = async () => {
    const summary = `${assignment.course_code}: ${assignment.title} — Safe Target: ${formatDayTime(
      safeTargetIso,
    )} | Official Due: ${formatFullDateTime(assignment.hard_deadline)}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* Contextual Sub-header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
          {assignment.course_code} · {assignment.course_name}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share assignment summary"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copiedShare ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onToggleStar(assignment)}
            aria-label={assignment.is_starred ? 'Unstar assignment' : 'Star assignment'}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors ${
              assignment.is_starred
                ? 'bg-amber-50 border-amber-200 text-amber-500'
                : 'bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-4 h-4 ${assignment.is_starred ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Layout Split on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Title, Safe-Zone Buffer, Strategy */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold mb-2">
              <span className="text-[#F95738]">
                High Impact: {assignment.grade_weight_pct}% of Total Grade
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-600 inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {assignment.estimated_minutes} Min Slot
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight [text-wrap:balance]">
              {assignment.title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-slate-700 mt-3">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Official Due Date:{' '}
                <strong className="font-semibold text-slate-900">
                  {formatFullDateTime(assignment.hard_deadline)}
                </strong>
              </span>
            </div>
          </div>

          {/* Safe-Zone Submission Target Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Safe-Zone Submission Target
                  </h2>
                  <p className="text-xs text-slate-500">Intelligent Proactive Buffer</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg tabular-nums">
                +{assignment.safe_buffer_hours}H SAFE
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-4 mb-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Flag className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="font-mono text-xs font-bold text-indigo-700 tabular-nums">
                      {formatDayTime(safeTargetIso)}
                    </p>
                    <p className="text-[11px] font-medium text-emerald-700">
                      Recommended Target
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-100 px-2.5 py-1 rounded-lg tabular-nums">
                  {assignment.safe_buffer_hours}h Safety Gap
                </span>

                <div className="flex items-center gap-2 text-right">
                  <div>
                    <p className="font-mono text-xs font-bold text-rose-700 tabular-nums">
                      {formatDayTime(assignment.hard_deadline)}
                    </p>
                    <p className="text-[11px] font-medium text-rose-600">
                      Hard Drop-Dead
                    </p>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-[#F95738] text-white flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-[#F95738]" />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Safe Buffer protects you from LMS server crashes, Wi-Fi failure, and last-minute panic.{' '}
              <strong className="font-semibold text-slate-900">94% of top scorers</strong> review within this window.
            </p>
          </div>

          {/* AI Study Strategy Card with Verified Study Image */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center gap-4">
            {!imgError ? (
              <img
                src={STUDY_DESK_IMAGE}
                alt="Linear algebra study notebook on an oak desk"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200/70"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-100 to-slate-100 flex items-center justify-center shrink-0 text-indigo-600">
                <BookOpen className="w-7 h-7" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Adaptive Study Strategy</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {milestones.length} High-Yield Milestones Generated
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                Personalized pace tailored to your hard cutoff and safe submission window.
              </p>
            </div>
          </div>

          {/* Instructor Notes Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
            <button
              type="button"
              onClick={() => setNotesOpen((o) => !o)}
              className="w-full min-h-[52px] px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-900">
                  Instructor Note &amp; Formula Guidelines
                </span>
              </div>
              {notesOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {notesOpen && (
              <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                {assignment.instructor_notes ||
                  'Follow rubric guidelines and verify all derivations before your Safe-Zone Target.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Milestone Breakdown, Peer Pulse & Actions */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-bold text-slate-900">Milestone Breakdown</h2>
              <span className="font-mono text-xs font-semibold text-indigo-700 tabular-nums">
                {completedCount} / {milestones.length} Completed
              </span>
            </div>

            {milestones.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Single-block deliverable. Start a 25m focus session or mark complete when submitted.
              </p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m, idx) => {
                  const isNext = !m.is_completed && nextMilestone?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                        m.is_completed
                          ? 'bg-slate-50 border-slate-200/70'
                          : isNext
                          ? 'bg-indigo-50/50 border-indigo-200'
                          : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleMilestone(assignment, m)}
                        className="flex items-start gap-3 text-left flex-1 min-w-0 min-h-[44px]"
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            m.is_completed
                              ? 'bg-emerald-600 text-white'
                              : isNext
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {m.is_completed ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span className="font-mono text-xs font-bold">{idx + 1}</span>
                          )}
                        </span>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold leading-snug ${
                              m.is_completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {m.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 tabular-nums">
                            Est. {m.est_minutes} min · {m.target_label}
                          </p>
                        </div>
                      </button>

                      {!m.is_completed && (
                        <button
                          type="button"
                          onClick={() => onStartFocusBlock(assignment, m)}
                          aria-label={`Start focus block for ${m.title}`}
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 flex items-center justify-center shrink-0 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => onToggleCompleteAssignment(assignment)}
              className={`mt-4 w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                assignment.status === 'completed'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {assignment.status === 'completed'
                ? 'Completed & Logged in Vault (Undo)'
                : 'Mark Full Deliverable Submitted'}
            </button>
          </div>

          {/* Peer Pulse */}
          <button
            type="button"
            onClick={onOpenSquad}
            className="w-full bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex -space-x-2 shrink-0">
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  AI
                </span>
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  KO
                </span>
                <span className="w-7 h-7 rounded-full bg-[#F95738] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  MR
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 truncate">
                Peer Pulse: <span className="text-indigo-700">64% of {assignment.course_code} squad</span> in Safe-Zone
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 whitespace-nowrap shrink-0">
              Open Chat →
            </span>
          </button>

          {/* Desktop Action Row */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSquad}
              className="min-h-[48px] px-5 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Squad</span>
            </button>
            <button
              type="button"
              onClick={() => onStartFocusBlock(assignment, nextMilestone)}
              className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#F95738] hover:bg-[#e1492b] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-[#F95738]/20 transition-colors whitespace-nowrap"
            >
              <Timer className="w-4 h-4" />
              <span>Start 25m Focus Block</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSquad}
          className="min-h-[48px] px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Squad</span>
        </button>
        <button
          type="button"
          onClick={() => onStartFocusBlock(assignment, nextMilestone)}
          className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F95738] hover:bg-[#e1492b] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md shadow-[#F95738]/20 whitespace-nowrap"
        >
          <Timer className="w-4 h-4" />
          <span>Start 25m Focus Block</span>
        </button>
      </div>
    </div>
  );
}
