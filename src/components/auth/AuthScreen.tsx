'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (role: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [passkey, setPasskey] = useState('');
  const [role, setRole] = useState<'marketer' | 'founder'>('marketer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError('Please enter your access passkey');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      onSuccess(data.role || role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid passkey';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md p-6 sm:p-8 glass-panel rounded-2xl shadow-2xl border border-slate-800/80 animate-in fade-in zoom-in-95 duration-200 mx-2">
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <ShieldCheck className="w-8 h-8" />
            <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-white">
              <Sparkles className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Social Hub</h2>
          <p className="text-sm text-slate-400 mt-1">
            Unified multi-channel distribution engine for Founders & Marketers
          </p>
        </div>

        {/* Role Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setRole('marketer')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                role === 'marketer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🚀 Digital Marketer
            </button>
            <button
              type="button"
              onClick={() => setRole('founder')}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                role === 'founder'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👔 Founder / Exec
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Access Passkey / PIN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder={role === 'founder' ? 'Enter Founder passkey...' : 'Enter Marketer passkey...'}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 text-white placeholder-slate-500 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
