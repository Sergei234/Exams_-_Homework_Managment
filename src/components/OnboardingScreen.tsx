import { useState, type ChangeEvent } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  GraduationCap,
  Hourglass,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { StudentProfile } from '../types/tempo';

interface OnboardingScreenProps {
  profile: StudentProfile;
  onCompleteOnboarding: (patch: Partial<StudentProfile>) => Promise<void>;
  onScanToQuickAdd: (prefillTitle: string, prefillCourse: string) => void;
}

const UNIVERSITIES = [
  { university: 'State University', faculty: 'Faculty of Sciences' },
  { university: 'Stanford University', faculty: 'School of Engineering' },
  { university: 'University of Toronto', faculty: 'Faculty of Arts & Science' },
  { university: 'ETH Zurich', faculty: 'Dept. of Mathematics & CS' },
];

const LMS_OPTIONS = ['Canvas', 'Moodle', 'Classroom'] as const;

export function OnboardingScreen({
  profile,
  onCompleteOnboarding,
  onScanToQuickAdd,
}: OnboardingScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedUniIdx, setSelectedUniIdx] = useState(0);
  const [lmsProvider, setLmsProvider] = useState<string>(profile.lms_provider || 'Canvas');
  const [lmsSynced, setLmsSynced] = useState<boolean>(profile.lms_connected);
  const [scanningMsg, setScanningMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedUni = UNIVERSITIES[selectedUniIdx] ?? UNIVERSITIES[0];

  const handleConnectLms = () => {
    setLmsSynced(true);
    setStep(2);
  };

  const handleFileScan = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningMsg(`Extracted 3 deadlines & weights from "${file.name}"`);
  };

  const handleActivate = async () => {
    setSaving(true);
    try {
      await onCompleteOnboarding({
        university: selectedUni.university,
        faculty: selectedUni.faculty,
        lms_provider: lmsProvider,
        lms_connected: lmsSynced,
        onboarding_completed: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold mb-2.5">
          <span className="text-indigo-700 tracking-wide uppercase">
            Step {step} of 2
          </span>
          <span className="text-slate-500">
            {step === 1 ? 'Academic Setup' : 'LMS & Buffer Confirmation'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Hero Summary */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50 via-white to-orange-50/70 rounded-3xl border border-slate-200/80 p-7 text-center">
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 mb-5">
            <Hourglass className="w-10 h-10" />
            <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight [text-wrap:balance] mb-3">
            Never Miss a Deadline Again
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Tempo converts your course syllabi into paced daily study milestones and safe submission buffers.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-700 pt-4 border-t border-slate-200/70 tabular-nums">
            <span>0 All-Nighters</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-emerald-700">GPA +0.5 Avg</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-indigo-700">100% On-Time</span>
          </div>
        </div>

        {/* Right Interactive Setup Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* University Selector */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <label
              htmlFor="university-select"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5"
            >
              Select Your University & Faculty
            </label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <select
                id="university-select"
                value={selectedUniIdx}
                onChange={(e) => setSelectedUniIdx(Number(e.target.value))}
                className="w-full min-h-[44px] text-sm font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {UNIVERSITIES.map((u, idx) => (
                  <option key={u.university} value={idx}>
                    {u.university} · {u.faculty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* One-Tap LMS Sync */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-indigo-700">
                Instant Auto-Sync
              </span>
              {lmsSynced && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lmsProvider} Ready</span>
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              One-Tap Canvas / Moodle / Classroom Sync
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Detects all assignment due dates, quiz alerts, and weighted rubrics directly.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {LMS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLmsProvider(opt)}
                    className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      lmsProvider === opt
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleConnectLms}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F95738] hover:bg-[#e1492b] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <span>{lmsSynced ? 'Synced' : 'Connect'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Camera Syllabus Scanner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Camera Syllabus Scanner
                    </h3>
                    <span className="text-xs font-medium text-indigo-600">
                      · OCR Fast
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Upload a photo or PDF of your paper syllabus — Tempo extracts all dates and grade weights in seconds.
                  </p>
                </div>
              </div>

              <label className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer flex items-center whitespace-nowrap shrink-0">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*,.pdf,.txt"
                  onChange={handleFileScan}
                  className="sr-only"
                />
              </label>
            </div>

            {scanningMsg && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-emerald-700">{scanningMsg}</p>
                <button
                  type="button"
                  onClick={() => onScanToQuickAdd('Syllabus Extracted Midterm', 'MATH 204')}
                  className="text-xs font-semibold text-indigo-600 hover:underline whitespace-nowrap"
                >
                  Review in Quick-Add →
                </button>
              </div>
            )}
          </div>

          {/* Privacy Guarantee */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100/80 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <p>
              <strong className="font-semibold text-slate-800">FERPA-compliant & encrypted.</strong>{' '}
              Your academic schedule is private and never shared with advertisers.
            </p>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleActivate}
            disabled={saving}
            className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-[#F95738] hover:bg-[#e1492b] active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#F95738]/20 transition-all"
          >
            <span>
              {saving ? 'Activating Semester...' : 'Activate My Stress-Free Semester'}
            </span>
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
