import { Bell, CheckCircle2, ShieldCheck, Users, X } from 'lucide-react';
import { formatTimeLeft } from '../lib/dateUtils';
import type { Assignment, SquadMessage } from '../types/tempo';

interface NotificationDrawerProps {
  assignments: Assignment[];
  messages: SquadMessage[];
  onClose: () => void;
  onSelectAssignment: (assignmentId: string) => void;
  onOpenSquad: () => void;
}

export function NotificationDrawer({
  assignments,
  messages,
  onClose,
  onSelectAssignment,
  onOpenSquad,
}: NotificationDrawerProps) {
  const activeUrgent = assignments
    .filter((a) => a.status === 'active')
    .slice(0, 3);
  const latestEvent = [...messages]
    .reverse()
    .find((m) => m.message_type === 'milestone_event' || !m.is_self);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Academic notifications"
    >
      <div className="w-full max-w-md bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Priority Alerts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {latestEvent && (
            <button
              type="button"
              onClick={() => {
                onOpenSquad();
                onClose();
              }}
              className="w-full text-left p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 mb-1">
                <Users className="w-4 h-4" />
                <span>Study Squad Update</span>
              </div>
              <p className="text-sm font-medium text-slate-900">{latestEvent.content}</p>
            </button>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Safe-Zone Buffer Radar
            </h3>
            {activeUrgent.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectAssignment(item.id);
                  onClose();
                }}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-indigo-700">{item.course_code}</span>
                  <span className="font-mono tabular-nums text-orange-600 font-medium">
                    {formatTimeLeft(item.hard_deadline)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{item.safe_buffer_hours}h safe-zone buffer active</span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero All-Nighter Streak Intact</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your deadlines are buffered ahead of portal cutoff locks. Keep knocking out 25m focus blocks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
