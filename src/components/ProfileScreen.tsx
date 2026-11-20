import { useMemo, useState } from 'react';
import {
  Award,
  BadgeCheck,
  Check,
  CheckCircle2,
  Database,
  Flame,
  Handshake,
  Share2,
  Shield,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { formatRelativeTime } from '../lib/dateUtils';
import { AIBEK_AVATAR_IMAGE, ELENA_AVATAR_IMAGE } from '../lib/seedData';
import type {
  Assignment,
  Badge,
  Endorsement,
  FocusSession,
  StudentProfile,
} from '../types/tempo';

interface ProfileScreenProps {
  profile: StudentProfile;
  assignments: Assignment[];
  focusSessions: FocusSession[];
  badges: Badge[];
  endorsements: Endorsement[];
  supabaseConnected: boolean;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenOnboardingSetup: () => void;
  onOpenSupabaseModal: () => void;
}

type ProfileTab = 'stats' | 'vault' | 'endorsements';

export function ProfileScreen({
  profile,
  assignments,
  focusSessions,
  badges,
  endorsements,
  supabaseConnected,
  onOpenAssignment,
  onOpenOnboardingSetup,
  onOpenSupabaseModal,
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('vault');
  const [copiedCard, setCopiedCard] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const completedVault = useMemo(
    () => assignments.filter((a) => a.status === 'completed'),
    [assignments],
  );

  const totalFocusMinutes = useMemo(
    () => focusSessions.reduce((sum, s) => sum + s.duration_minutes, 0),
    [focusSessions],
  );

  const handleShareCard = async () => {
    const summary = `${profile.full_name} — Academic Reliability Score: ${profile.reliability_score}/100 · ${profile.deadlines_met} Deadlines Met On-Time · +${profile.avg_safe_buffer_hours}h Avg Safe Buffer (${profile.university})`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedCard(true);
      window.setTimeout(() => setCopiedCard(false), 2200);
    } catch {
      setCopiedCard(true);
      window.setTimeout(() => setCopiedCard(false), 2200);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Identity + Reliability Score + Cohort Rank */}
        <div className="lg:col-span-5 space-y-5">
          {/* Identity Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 text-center">
            <div className="relative inline-block mb-4">
              {!avatarErr ? (
                <img
                  src={profile.avatar_url || AIBEK_AVATAR_IMAGE}
                  alt={profile.full_name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarErr(true)}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-600/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 text-white text-2xl font-bold flex items-center justify-center ring-4 ring-indigo-600/20">
                  AN
                </div>
              )}
              <span
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-white"
                title="Verified Academic Profile"
              >
                <BadgeCheck className="w-4 h-4" />
              </span>
            </div>

            <h1 className="text-xl font-bold text-slate-900">{profile.full_name}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {profile.major} · {profile.year_label}
            </p>
            <p className="text-xs font-semibold text-indigo-700 mt-2">
              {profile.tier_label} · {profile.university}
            </p>

            <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onOpenOnboardingSetup}
                className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>LMS Setup</span>
              </button>
              <button
                type="button"
                onClick={onOpenSupabaseModal}
                className="min-h-[42px] px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{supabaseConnected ? 'Supabase Sync' : 'Connect Cloud'}</span>
              </button>
            </div>
          </div>

          {/* Reliability Score Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Reliability Score</h2>
              <div className="flex items-center gap-1 font-mono tabular-nums">
                <Star className="w-4 h-4 text-[#F95738] fill-[#F95738]" />
                <span className="text-2xl font-bold text-indigo-700">
                  {profile.reliability_score}
                </span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl border border-slate-200/70 p-3.5 text-center">
              <div>
                <p className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {profile.deadlines_met}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Deadlines Met
                </p>
              </div>
              <div className="border-x border-slate-200">
                <p className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
                  {profile.late_penalties}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Late Penalties
                </p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-indigo-700 tabular-nums">
                  +{profile.avg_safe_buffer_hours}h
                </p>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Avg Buffer
                </p>
              </div>
            </div>

            <div className="w-full px-4 py-3 rounded-2xl bg-[#F95738] text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Flame className="w-4 h-4" />
                <span className="tabular-nums">
                  {profile.streak_days}-Day Momentum Streak
                </span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                Top Form
              </span>
            </div>
          </div>

          {/* Cohort Rank */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider tabular-nums">
                Cohort Rank #{profile.cohort_rank}
              </p>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                Top <strong className="font-bold text-indigo-700">{profile.cohort_percentile}%</strong> for deadline consistency across your faculty this semester.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs, Vault, Badges, Endorsement */}
        <div className="lg:col-span-7 space-y-5">
          {/* Interactive Segmented Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Focus Stats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                activeTab === 'vault'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedVault.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('endorsements')}
              className={`min-h-[42px] px-2 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap tabular-nums ${
                activeTab === 'endorsements'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Endorsements ({endorsements.length})
            </button>
          </div>

          {/* Tab Body */}
          {activeTab === 'vault' && (
            <div className="space-y-2.5">
              {completedVault.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenAssignment(item.id)}
                  className="w-full bg-white rounded-2xl border border-slate-200/90 p-4 flex items-center justify-between gap-3 hover:border-indigo-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {item.course_code} · Submitted {item.submitted_early_hours ?? item.safe_buffer_hours}h early
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 tabular-nums">
                    +{item.safe_buffer_hours}h Buffer
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Deep Work Focus Log</h3>
                  <p className="text-xs text-slate-500">Pomodoro &amp; 25m sprint blocks</p>
                </div>
                <span className="font-mono text-lg font-bold text-indigo-700 tabular-nums">
                  {totalFocusMinutes} min
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 items-end h-28 pt-2">
                {[35, 50, 75, 45, 90, 60, Math.min(100, Math.round(totalFocusMinutes / 2))].map(
                  (pct, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        className={`w-full rounded-t-lg ${
                          idx === 6 ? 'bg-[#F95738]' : 'bg-indigo-600/80'
                        }`}
                        style={{ height: `${Math.max(18, pct)}%` }}
                      />
                      <span className="font-mono text-[10px] text-slate-500">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {activeTab === 'endorsements' && (
            <div className="space-y-3">
              {endorsements.map((end) => (
                <div
                  key={end.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Peer Endorsement</span>
                    <span className="text-xs font-semibold text-emerald-700">Verified Active</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <img
                      src={end.author_avatar_url || ELENA_AVATAR_IMAGE}
                      alt={end.author_name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{end.author_name}</p>
                        <span className="text-[11px] text-slate-400">
                          {formatRelativeTime(end.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 italic mt-1 leading-relaxed">
                        &ldquo;{end.quote}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Earned Accountability Badges */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Earned Accountability Badges
              </h2>
              <span className="text-xs font-semibold text-indigo-700 tabular-nums">
                {badges.length} Earned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {badges.map((b) => {
                const Icon =
                  b.icon_key === 'shield'
                    ? Shield
                    : b.icon_key === 'bolt'
                    ? Zap
                    : b.icon_key === 'handshake'
                    ? Handshake
                    : Award;
                const iconBg =
                  b.icon_key === 'shield'
                    ? 'bg-indigo-50 text-indigo-600'
                    : b.icon_key === 'bolt'
                    ? 'bg-rose-50 text-[#F95738]'
                    : 'bg-emerald-50 text-emerald-700';

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-2"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{b.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Latest Squad Endorsement & Share Card CTA */}
          {endorsements[0] && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Latest Squad Endorsement
                </span>
                <span className="text-xs font-semibold text-emerald-700">Verified Active</span>
              </div>

              <div className="flex items-start gap-3">
                <img
                  src={endorsements[0].author_avatar_url || ELENA_AVATAR_IMAGE}
                  alt={endorsements[0].author_name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900">
                      {endorsements[0].author_name}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(endorsements[0].created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic mt-1 leading-relaxed">
                    &ldquo;{endorsements[0].quote}&rdquo;
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleShareCard}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {copiedCard ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied Verified Academic Card</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Share Verified Academic Card</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
