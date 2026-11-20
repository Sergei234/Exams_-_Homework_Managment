import { useMemo, useState, type FormEvent } from 'react';
import {
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Lightbulb,
  Link2,
  PenLine,
  Plus,
  ScanLine,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { formatShortDateTime, getSafeBufferTargetIso } from '../lib/dateUtils';
import type { CreateAssignmentInput } from '../lib/tempoDb';
import type { Course, DeliverableType } from '../types/tempo';

interface QuickAddScreenProps {
  courses: Course[];
  prefillTitle?: string;
  prefillCourseCode?: string;
  onCancel: () => void;
  onCreateCourse: (code: string, name: string) => Promise<Course>;
  onSaveAssignment: (input: CreateAssignmentInput) => Promise<void>;
}

const DELIVERABLE_TYPES: { id: DeliverableType; label: string; icon: typeof PenLine }[] = [
  { id: 'homework', label: 'Homework', icon: PenLine },
  { id: 'exam', label: 'Exam', icon: GraduationCap },
  { id: 'paper', label: 'Paper', icon: FileText },
  { id: 'reading', label: 'Reading', icon: BookOpen },
];

export function QuickAddScreen({
  courses,
  prefillTitle,
  prefillCourseCode,
  onCancel,
  onCreateCourse,
  onSaveAssignment,
}: QuickAddScreenProps) {
  const defaultDeadlineLocal = useMemo(() => {
    const d = new Date(Date.now() + 72 * 3600 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
  }, []);

  const [title, setTitle] = useState(prefillTitle || 'Physics 101 Lab Report #3');
  const [description, setDescription] = useState(
    'Experimental error analysis, curve fitting & proof verification',
  );
  const [selectedCourseCode, setSelectedCourseCode] = useState(
    prefillCourseCode || courses[3]?.code || courses[0]?.code || 'PHYS 101',
  );
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('homework');
  const [hardDeadlineLocal, setHardDeadlineLocal] = useState(defaultDeadlineLocal);
  const [safeBufferEnabled, setSafeBufferEnabled] = useState(true);
  const [safeBufferHours, setSafeBufferHours] = useState(24);
  const [gradeWeightPct, setGradeWeightPct] = useState(15);
  const [estHours, setEstHours] = useState(2.5);
  const [autoMilestones, setAutoMilestones] = useState(true);
  const [lmsUrl, setLmsUrl] = useState('');
  const [showLmsInput, setShowLmsInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerText, setScannerText] = useState('');
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [saving, setSaving] = useState(false);

  const hardIso = useMemo(() => {
    const parsed = new Date(hardDeadlineLocal);
    return Number.isNaN(parsed.getTime())
      ? new Date(Date.now() + 72 * 3600 * 1000).toISOString()
      : parsed.toISOString();
  }, [hardDeadlineLocal]);

  const safeTargetIso = getSafeBufferTargetIso(
    hardIso,
    safeBufferEnabled ? safeBufferHours : 0,
  );

  const generatedMilestones = useMemo(() => {
    if (!autoMilestones) return [];
    if (deliverableType === 'exam') {
      return [
        '1. Core Concepts & Notes Audit',
        '2. Timed Practice Exam',
        '3. Formula Sheet Final Review',
      ];
    }
    if (deliverableType === 'paper') {
      return [
        '1. Thesis & Literature Outline',
        '2. Primary Draft & Citations',
        '3. Safe-Zone Proofread & Export',
      ];
    }
    if (deliverableType === 'reading') {
      return ['1. Focused 25m Annotated Reading'];
    }
    return ['1. Lab Data & Outline', '2. Core Calculations', '3. Final Proof & Upload'];
  }, [autoMilestones, deliverableType]);

  const handleParseSyllabusText = () => {
    const clean = scannerText.trim();
    if (!clean) return;
    setTitle(clean.slice(0, 72));
    if (clean.toLowerCase().includes('exam') || clean.toLowerCase().includes('midterm')) {
      setDeliverableType('exam');
      setGradeWeightPct(30);
    }
    setShowScanner(false);
  };

  const handleAddCourse = async () => {
    if (!newCourseCode.trim()) return;
    const created = await onCreateCourse(
      newCourseCode.trim().toUpperCase(),
      newCourseName.trim() || newCourseCode.trim().toUpperCase(),
    );
    setSelectedCourseCode(created.code);
    setNewCourseCode('');
    setNewCourseName('');
    setShowNewCourse(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const matchedCourse = courses.find((c) => c.code === selectedCourseCode);
      await onSaveAssignment({
        courseId: matchedCourse?.id ?? null,
        courseCode: selectedCourseCode,
        courseName: matchedCourse?.name ?? selectedCourseCode,
        title: title.trim(),
        description: description.trim(),
        deliverableType,
        gradeWeightPct,
        estimatedMinutes: Math.max(20, Math.round(estHours * 60)),
        hardDeadline: hardIso,
        safeBufferHours: safeBufferEnabled ? safeBufferHours : 0,
        safeBufferEnabled,
        instructorNotes: 'Added via Tempo Quick-Add with proactive safe-zone buffer.',
        lmsSourceUrl: lmsUrl.trim(),
        autoMilestones: generatedMilestones,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>

        <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
          Quick Add Task &amp; Exam
        </h1>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Syllabus Scan & LMS Import Quick Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setShowScanner((s) => !s)}
          className="bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-left flex items-center gap-3.5 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">
                Scan Syllabus or Board
              </span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            </div>
            <p className="text-xs text-slate-600 truncate">
              Extracts dates, grading weight &amp; milestones
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowLmsInput((v) => !v)}
          className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left flex items-center gap-3.5 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900 block">
              Import Canvas / LMS Assignment
            </span>
            <p className="text-xs text-slate-500 truncate">
              Paste assignment link or course URL
            </p>
          </div>
        </button>
      </div>

      {showScanner && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-700">
              Paste syllabus line or assignment prompt
            </p>
            <button
              type="button"
              onClick={() => setShowScanner(false)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Close syllabus scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            rows={2}
            value={scannerText}
            onChange={(e) => setScannerText(e.target.value)}
            placeholder="e.g. Midterm Exam #2: Vector Calculus & Stokes Theorem — Due Nov 28"
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            type="button"
            onClick={handleParseSyllabusText}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Extract Title &amp; Type
          </button>
        </div>
      )}

      {showLmsInput && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Canvas / Moodle / Google Classroom URL
          </label>
          <input
            type="url"
            value={lmsUrl}
            onChange={(e) => setLmsUrl(e.target.value)}
            placeholder="https://canvas.university.edu/courses/204/assignments/12"
            className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Form Fields */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-5">
            <div>
              <label
                htmlFor="assignment-title"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Assignment or Exam Title
              </label>
              <div className="relative">
                <input
                  id="assignment-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Physics 101 Lab Report #3"
                  className="w-full min-h-[48px] px-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
                {title && (
                  <button
                    type="button"
                    onClick={() => setTitle('')}
                    aria-label="Clear title"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="assignment-desc"
                className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2"
              >
                Scope / Key Topics
              </label>
              <input
                id="assignment-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Topics, equations, or chapter focus"
                className="w-full min-h-[44px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>

            {/* Course Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Course / Class
                </span>
                <span className="text-xs font-semibold text-indigo-700">Fall Semester</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {courses.map((course) => {
                  const active = selectedCourseCode === course.code;
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => setSelectedCourseCode(course.code)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {course.code}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowNewCourse((v) => !v)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              {showNewCourse && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="Code (e.g. BIO 202)"
                    className="sm:w-32 min-h-[40px] px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                  />
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Course Name"
                    className="flex-1 min-h-[40px] px-3 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCourse}
                    className="min-h-[40px] px-3.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    Add Course
                  </button>
                </div>
              )}
            </div>

            {/* Deliverable Type */}
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Deliverable Type
              </span>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {DELIVERABLE_TYPES.map((dt) => {
                  const Icon = dt.icon;
                  const active = deliverableType === dt.id;
                  return (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDeliverableType(dt.id)}
                      className={`min-h-[52px] py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="whitespace-nowrap">{dt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hard Deadline, Safe Buffer & AI Estimate */}
        <div className="lg:col-span-5 space-y-5">
          {/* Hard Deadline + Safe Buffer */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F95738]" />
                <h2 className="text-sm font-bold text-slate-900">Hard Deadline</h2>
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                CUTOFF
              </span>
            </div>

            <div>
              <input
                type="datetime-local"
                value={hardDeadlineLocal}
                onChange={(e) => setHardDeadlineLocal(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Grade Weight (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={gradeWeightPct}
                  onChange={(e) => setGradeWeightPct(Number(e.target.value) || 10)}
                  className="w-full min-h-[42px] px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Est. Hours
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={0.5}
                  max={40}
                  value={estHours}
                  onChange={(e) => setEstHours(Number(e.target.value) || 1)}
                  className="w-full min-h-[42px] px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>
            </div>

            {/* 24h Safe Buffer Target */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F95738] text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {safeBufferHours}h Safe-Buffer Target
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {safeBufferEnabled ? formatShortDateTime(safeTargetIso) : 'Buffer off'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={safeBufferEnabled}
                  aria-label="Toggle 24h safe-buffer target"
                  onClick={() => setSafeBufferEnabled((v) => !v)}
                  className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center shrink-0 ${
                    safeBufferEnabled ? 'bg-[#F95738] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {safeBufferEnabled && (
                <>
                  <div className="flex items-center gap-2 my-2">
                    {[12, 24, 48].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setSafeBufferHours(hrs)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors ${
                          safeBufferHours === hrs
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {hrs}h buffer
                      </button>
                    ))}
                  </div>
                  <div className="w-full h-2 rounded-full bg-rose-200 overflow-hidden mb-1.5">
                    <div className="h-full bg-emerald-600 w-3/4" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium">
                    <span className="text-emerald-700">Complete in Safe-Zone (+15 XP)</span>
                    <span className="text-rose-600">Server Stress Zone</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Workload Estimate & Auto-Milestones */}
          <div className="bg-indigo-50/70 rounded-2xl border border-indigo-100 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  Workload Estimate: {estHours} hours
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Based on historical {selectedCourseCode} pacing &amp; syllabus weight.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-indigo-100 cursor-pointer">
              <input
                type="checkbox"
                checked={autoMilestones}
                onChange={(e) => setAutoMilestones(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-indigo-600"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Auto-break into {generatedMilestones.length || 3} paced milestones
                </p>
                {autoMilestones && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {generatedMilestones.join(' · ')}
                  </p>
                )}
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>
              {saving ? 'Locking In Schedule...' : 'Lock In Deadline & Schedule'}
            </span>
          </button>
          <p className="text-center text-xs text-slate-500">
            Synced directly to your Tempo schedule &amp; Supabase workspace
          </p>
        </div>
      </div>
    </form>
  );
}
