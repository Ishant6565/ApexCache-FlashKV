'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database, Lock, Mail, ArrowRight, AlertCircle, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('engineer@apexcache.io');
  const [password, setPassword] = useState('Demo1234!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c16] flex items-center justify-center p-6 relative">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Database className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">ApexCache</span>
          </Link>
          <h1 className="text-xl font-semibold text-white">Sign in to Storage Control Plane</h1>
          <p className="text-xs text-slate-400 mt-1">LSM-Tree KV Engine, Consistent Hashing & Raft Cluster</p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <span className="text-[11px] text-slate-400">Default: Demo1234!</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
              ) : (
                <>
                  Access Storage Workbench <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                setEmail('engineer@apexcache.io');
                setPassword('Demo1234!');
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Quick-Fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
