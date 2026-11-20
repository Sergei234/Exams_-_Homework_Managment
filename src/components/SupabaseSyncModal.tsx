import { useState, type FormEvent } from 'react';
import { Check, Copy, Database, KeyRound, LogOut, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { testSupabaseHealth } from '../lib/tempoDb';

interface SupabaseSyncModalProps {
  connected: boolean;
  notice: string | null;
  userEmail: string | null;
  onClose: () => void;
  onRefreshFromSupabase: () => Promise<void>;
}

const SCHEMA_SNIPPET = `-- Run supabase_schema.sql in Supabase Dashboard -> SQL Editor
-- Tables: student_profiles, courses, assignments, milestones,
-- study_sprints, sprint_attendees, squad_messages,
-- focus_sessions, badges, endorsements`;

export function SupabaseSyncModal({
  connected,
  notice,
  userEmail,
  onClose,
  onRefreshFromSupabase,
}: SupabaseSyncModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setStatusMsg(error.message);
        } else {
          setStatusMsg('Signed in with Supabase Auth. Syncing workspace...');
          await onRefreshFromSupabase();
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setStatusMsg(error.message);
        } else {
          setStatusMsg('Account created. Check your inbox if email confirmation is enabled.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    setStatusMsg('Signed out of Supabase session.');
    setBusy(false);
    await onRefreshFromSupabase();
  };

  const handleCheckConnection = async () => {
    setBusy(true);
    const res = await testSupabaseHealth();
    setStatusMsg(res.message);
    if (res.connected) {
      await onRefreshFromSupabase();
    }
    setBusy(false);
  };

  const handleCopySqlHint = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SNIPPET);
      setCopiedSql(true);
      window.setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      setStatusMsg('See supabase_schema.sql in the project root.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="supabase-modal-title" className="text-base font-bold text-slate-900">
                Supabase Live Sync & Auth
              </h2>
              <p className="text-xs text-slate-500">
                {connected
                  ? 'Connected to live PostgreSQL & Realtime'
                  : 'Local workspace active · Configure RLS/schema for cloud sync'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Supabase sync modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notice && !connected && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-4 leading-relaxed">
            <p className="font-semibold mb-1">Supabase Response: {notice}</p>
            <p>
              Run <code className="font-mono font-semibold">supabase_schema.sql</code> in your Supabase SQL Editor to enable full anonymous & authenticated table sync.
            </p>
            <button
              type="button"
              onClick={handleCopySqlHint}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 underline"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied schema summary' : 'Copy schema reference'}</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
          <div className="text-xs">
            <p className="font-semibold text-slate-900">
              {userEmail ? `Signed in as ${userEmail}` : 'Guest Academic Workspace'}
            </p>
            <p className="text-slate-500 mt-0.5">
              Project: <span className="font-mono">ivhjevgoioimooclkqhb</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleCheckConnection}
            disabled={busy}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>Test Sync</span>
          </button>
        </div>

        {userEmail ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  authMode === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  authMode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Create Account
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aibek@university.edu"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>{authMode === 'signin' ? 'Sign In with Supabase' : 'Sign Up with Supabase'}</span>
            </button>
          </form>
        )}

        {statusMsg && (
          <p className="mt-4 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2.5">
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}
