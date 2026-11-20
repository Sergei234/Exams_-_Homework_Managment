import { useEffect, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import type { Assignment, Milestone } from '../types/tempo';

interface FocusTimerModalProps {
  assignment: Assignment;
  milestone?: Milestone;
  onClose: () => void;
  onCompleteSession: (durationMinutes: number) => void;
}

export function FocusTimerModal({
  assignment,
  milestone,
  onClose,
  onCompleteSession,
}: FocusTimerModalProps) {
  const defaultMinutes = milestone?.est_minutes && milestone.est_minutes <= 45 ? 25 : 25;
  const [secondsLeft, setSecondsLeft] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(true);
  const [completed, setCompleted] = useState(false);

  const totalSeconds = defaultMinutes * 60;
  const progressPct = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);

  useEffect(() => {
    if (!running || completed) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, completed]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const handleFinishNow = () => {
    const elapsedMins = Math.max(1, Math.round((totalSeconds - secondsLeft) / 60) || defaultMinutes);
    onCompleteSession(elapsedMins);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-timer-title"
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl p-6 pb-8 sm:pb-6">
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-indigo-600 mb-1">
              {assignment.course_code} · Safe-Zone Focus Block
            </p>
            <h2 id="focus-timer-title" className="text-lg font-bold text-slate-900 leading-snug">
              {milestone ? milestone.title : assignment.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close focus timer"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
            <Timer className="w-4 h-4 text-indigo-600" />
            <span>{completed ? 'Focus block complete' : running ? 'Deep work active' : 'Paused'}</span>
          </div>
          <div className="font-mono text-5xl font-bold tracking-tight text-slate-900 tabular-nums my-2">
            {mins}:{secs}
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 tabular-nums">
            {progressPct}% of {defaultMinutes}-minute Pomodoro complete
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!completed ? (
            <>
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{running ? 'Pause' : 'Resume'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(totalSeconds);
                }}
                aria-label="Reset timer"
                className="min-h-[48px] min-w-[48px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFinishNow}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F95738] hover:bg-[#e1492b] text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Log Block</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleFinishNow}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Save {defaultMinutes}m Focus Block to Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
