import { useState, type FormEvent } from 'react';
import {
  BellOff,
  BellRing,
  CalendarClock,
  Check,
  CheckCheck,
  Clock,
  Flag,
  Info,
  MapPin,
  Send,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { formatMessageClock } from '../lib/dateUtils';
import type { SprintAttendee, SquadMessage, StudySprint } from '../types/tempo';

interface StudySquadScreenProps {
  sprint: StudySprint;
  attendees: SprintAttendee[];
  messages: SquadMessage[];
  onToggleSeatConfirm: (sprint: StudySprint) => Promise<void>;
  onSuggestTime: (sprint: StudySprint, timeWindow: string, location: string) => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
}

const QUICK_REPLIES = [
  "I'll be there at 17:00",
  'Starting 25m Pomodoro',
  'Sharing formula sheet',
];

export function StudySquadScreen({
  sprint,
  attendees,
  messages,
  onToggleSeatConfirm,
  onSuggestTime,
  onSendMessage,
}: StudySquadScreenProps) {
  const [draft, setDraft] = useState('');
  const [muted, setMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestedWindow, setSuggestedWindow] = useState(sprint.time_window);
  const [suggestedLocation, setSuggestedLocation] = useState(sprint.location);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    await onSendMessage(text);
  };

  const handleSubmitSuggestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!suggestedWindow.trim() || !suggestedLocation.trim()) return;
    await onSuggestTime(sprint, suggestedWindow.trim(), suggestedLocation.trim());
    setShowSuggestModal(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-4">
      {/* Left Column on Desktop / Top Summary on Mobile: Sprint Scheduler */}
      <div className="lg:col-span-5 space-y-4">
        {/* Squad Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex -space-x-2 shrink-0">
              <span className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                CS
              </span>
              <span className="w-9 h-9 rounded-full bg-[#F95738] text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                AM
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 truncate">
                Study Squad Chat
              </h1>
              <p className="text-xs text-emerald-700 font-medium truncate">
                4 online · {sprint.course_code} Sprint
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute squad notifications' : 'Mute squad notifications'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
            >
              {muted ? <BellOff className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              aria-label="Squad info"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showInfo && (
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-indigo-900">Accountability Protocol</p>
            <p>
              Squad members share Safe-Zone milestones and synchronized 25m deep-work Pomodoro blocks before exams.
            </p>
          </div>
        )}

        {/* Pinned Squad Prep Target */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Flag className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-sm font-bold text-slate-900 truncate">
                {sprint.title}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-700 tabular-nums shrink-0">
              {sprint.prep_progress_pct}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Squad Prep Target</span>
            <span className="text-emerald-700 font-semibold">Safe Buffer Intact</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${sprint.prep_progress_pct}%` }}
            />
          </div>
        </div>

        {/* Study Sprint Sync Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                  Study Sprint Sync
                </p>
                <h2 className="text-sm font-bold text-slate-900">
                  Focus Session Scheduled
                </h2>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg whitespace-nowrap">
              Lock-in Active
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">{sprint.location}</p>
                <p className="text-[11px] text-slate-500">{sprint.room_details}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#F95738] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900 tabular-nums">
                  {sprint.sprint_date_label}, {sprint.time_window}
                </p>
                <p className="text-[11px] text-slate-500">
                  2h Silent Deep Work + 15m Q&amp;A Sprint
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex -space-x-2 shrink-0">
                {attendees.map((a) => (
                  <span
                    key={a.id}
                    className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white ${a.avatar_color}`}
                  >
                    {a.initials}
                  </span>
                ))}
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900 tabular-nums">
                  {attendees.filter((a) => a.confirmed).length} attending
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {attendees.map((a) => a.display_name).join(', ')}
                </p>
              </div>
            </div>

            {sprint.is_confirmed_by_user && (
              <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowSuggestModal(true)}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <CalendarClock className="w-4 h-4" />
              <span>Suggest Time</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleSeatConfirm(sprint)}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                sprint.is_confirmed_by_user
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#F95738] hover:bg-[#e1492b] text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{sprint.is_confirmed_by_user ? 'Seat Confirmed' : 'Confirm My Seat'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column on Desktop / Chat Stream */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 flex flex-col min-h-[460px] lg:h-[680px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            if (msg.message_type === 'milestone_event' || msg.message_type === 'schedule_suggestion') {
              return (
                <div
                  key={msg.id}
                  className="mx-auto max-w-md text-center px-4 py-2 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs font-medium text-indigo-900"
                >
                  {msg.content}
                </div>
              );
            }

            if (msg.is_self) {
              return (
                <div key={msg.id} className="flex flex-col items-end">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                    <span className="font-mono tabular-nums">
                      {formatMessageClock(msg.created_at)}
                    </span>
                    <span className="font-semibold text-indigo-700">You</span>
                  </div>
                  <div className="flex items-end gap-2 max-w-[85%]">
                    <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-indigo-600 text-white text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {msg.sender_initials}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-indigo-600 mt-1 mr-9">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read by {msg.read_by_count}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex flex-col items-start">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1 ml-9">
                  <span className="font-semibold text-slate-700">{msg.sender_name}</span>
                  <span className="font-mono tabular-nums">
                    {formatMessageClock(msg.created_at)}
                  </span>
                </div>
                <div className="flex items-end gap-2 max-w-[85%]">
                  <span
                    className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${msg.sender_color}`}
                  >
                    {msg.sender_initials}
                  </span>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-100 text-slate-900 text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Replies + Focus Presence + Composer */}
        <div className="border-t border-slate-200 p-3.5 sm:p-4 space-y-3 bg-slate-50/60 rounded-b-2xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr}
                type="button"
                onClick={() => onSendMessage(qr)}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors"
              >
                {qr}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-medium text-emerald-700">
              {sprint.focused_mates_count} squad mates currently focused
            </span>
            <span className="font-semibold text-indigo-700">{sprint.course_code} Sprint</span>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSuggestModal(true)}
              aria-label="Schedule sprint time"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center shrink-0"
            >
              <CalendarClock className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message squad or sync schedule..."
              className="flex-1 min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
              className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Suggest Time Modal */}
      {showSuggestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Suggest sprint time"
        >
          <form
            onSubmit={handleSubmitSuggestion}
            className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Suggest Study Sprint Time
              </h3>
              <button
                type="button"
                onClick={() => setShowSuggestModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Time Window
              </label>
              <input
                type="text"
                required
                value={suggestedWindow}
                onChange={(e) => setSuggestedWindow(e.target.value)}
                placeholder="18:30 – 20:30"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Campus Room / Location
              </label>
              <input
                type="text"
                required
                value={suggestedLocation}
                onChange={(e) => setSuggestedLocation(e.target.value)}
                placeholder="University Library Floor 3"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              Update Sprint &amp; Notify Squad
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
