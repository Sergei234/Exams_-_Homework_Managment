import { useState, type FormEvent } from 'react';
import { BookOpen, GraduationCap, Plus, Users } from 'lucide-react';
import type { Assignment, Course } from '../types/tempo';

interface CoursesScreenProps {
  courses: Course[];
  assignments: Assignment[];
  onCreateCourse: (code: string, name: string, instructor?: string) => Promise<Course>;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenQuickAddForCourse: (courseCode: string) => void;
}

export function CoursesScreen({
  courses,
  assignments,
  onCreateCourse,
  onOpenAssignment,
  onOpenQuickAddForCourse,
}: CoursesScreenProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    await onCreateCourse(code.trim().toUpperCase(), name.trim(), instructor.trim() || undefined);
    setCode('');
    setName('');
    setInstructor('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Enrolled Courses
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            Fall Semester Roster
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl border border-indigo-200 p-5 grid grid-cols-1 sm:grid-cols-4 gap-3"
        >
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code (e.g. STAT 310)"
            className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
          />
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Course Title"
            className="sm:col-span-2 min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Save Course
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const courseTasks = assignments.filter(
            (a) => a.course_code === course.code && a.status === 'active',
          );

          return (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-indigo-700">{course.code}</span>
                  <span className="text-xs text-slate-500 inline-flex items-center gap-1 tabular-nums">
                    <Users className="w-3.5 h-3.5" />
                    {course.prep_buddies_count} prep buddies
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{course.name}</h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>
                    {course.instructor} · {course.semester}
                  </span>
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {courseTasks.length === 0 ? (
                  <p className="text-xs text-slate-400">No active deadlines buffered</p>
                ) : (
                  courseTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onOpenAssignment(t.id)}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="text-xs font-semibold text-slate-800 truncate flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-emerald-700 shrink-0 tabular-nums">
                        +{t.safe_buffer_hours}h safe
                      </span>
                    </button>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenQuickAddForCourse(course.code)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Deliverable to {course.code}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
