'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  FileCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Play,
  Flame,
} from 'lucide-react';

export default function SecurityPage() {
  const [crossTenantKey, setCrossTenantKey] = useState('prod:item_001');
  const [probeResult, setProbeResult] = useState<any>(null);
  const [probing, setProbing] = useState(false);

  const handleProbeIsolation = async () => {
    setProbing(true);
    setProbeResult(null);

    try {
      const res = await fetch('/api/security/test-isolation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crossTenantQueryKey: crossTenantKey,
        }),
      });
      const d = await res.json();
      setProbeResult(d);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProbing(false);
    }
  };

  const pillars = [
    {
      number: '1',
      title: 'Secure Authentication & API Key Scoping',
      status: 'ENFORCED',
      description:
        '12-round salted Bcrypt password hashing, 7-day secure HttpOnly JWT sessions, and unique hashed programmatic API keys for high-throughput clients.',
      file: 'src/lib/security/auth.ts',
      checks: [
        'Bcrypt 12-round salt hashing',
        'HttpOnly signed JWT session cookies',
        'Scoped apk_live_... programmatic API keys',
      ],
    },
    {
      number: '2',
      title: 'Multi-Tenant Keyspace Isolation (IDOR Defense)',
      status: 'ENFORCED',
      description:
        'Keyspace boundary partitioning ensures client queries cannot access or modify key-value pairs belonging to unauthorized tenants.',
      file: 'src/lib/engine/lsm-tree.ts',
      checks: [
        'KeyspaceId & Key compound indexing',
        'Zero cross-tenant vector contamination',
        'Partitioned eviction pools',
      ],
    },
    {
      number: '3',
      title: 'Protected Storage Engine & Clean Environment',
      status: 'ENFORCED',
      description:
        'Server-only storage execution boundaries, clean .env.example with placeholder keys, and strict .gitignore protecting dev.db and WAL files.',
      file: '.env.example & src/lib/db.ts',
      checks: [
        'Server-side only database execution',
        '.gitignore protects dev.db and .env',
        'Zero storage engine internals in frontend',
      ],
    },
    {
      number: '4',
      title: 'Buffer Overflow & Memory Exhaustion Defense',
      status: 'ENFORCED',
      description:
        'Strict Zod schema limits enforcing max key size (256 bytes) and max value payload limits (2 MB) preventing server memory exhaustion.',
      file: 'src/lib/security/validation.ts',
      checks: [
        'Max key size bounded to 256 bytes',
        'Max value payload bounded to 2 MB',
        'Keyspace maxKeys capacity caps',
      ],
    },
    {
      number: '5',
      title: 'IOPS Throughput & Concurrency Limiting',
      status: 'ENFORCED',
      description:
        'Sliding-window IP rate limiters on read/write endpoints preventing resource starvation and denial-of-service.',
      file: 'src/lib/security/rate-limit.ts',
      checks: [
        'Read IOPS limiter (200 req/min)',
        'Write IOPS limiter (100 req/min)',
        'Auto-purging in-memory tracking',
      ],
    },
    {
      number: '6',
      title: 'Immutable WAL & Storage Audit Logs',
      status: 'ENFORCED',
      description:
        'Append-only Write-Ahead Logging (WAL) with monotonic sequence numbers and immutable audit logs of all compactions and leader elections.',
      file: 'src/lib/security/audit.ts',
      checks: [
        'Risk level logging (LOW, MEDIUM, CRITICAL)',
        'WAL transaction sequence numbers',
        'Leader election audit logs',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4" /> 6 / 6 Storage Security Controls Active
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Keyspace Security & Isolation</h1>
        <p className="text-xs text-slate-400 mt-1">
          Multi-tenant keyspace partitioning, buffer exhaustion defense, and storage audit logs.
        </p>
      </div>

      {/* Interactive Isolation Probe Sandbox */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" /> Multi-Tenant Keyspace Isolation Probe
        </h2>
        <p className="text-xs text-slate-400">
          Attempt to query a product catalog key (`prod:item_001`) from inside the `session_cache` keyspace:
        </p>

        <div className="flex flex-col sm:flex-row gap-3 text-xs">
          <input
            type="text"
            value={crossTenantKey}
            onChange={(e) => setCrossTenantKey(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
          />
          <button
            onClick={handleProbeIsolation}
            disabled={probing}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {probing ? 'Probing Partition Boundaries...' : 'Probe Cross-Tenant Boundary'}
          </button>
        </div>

        {probeResult && (
          <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Isolation Verdict:</span>
              <span
                className={`px-3 py-1 rounded-full font-mono text-[11px] font-bold border ${
                  probeResult.verdict === 'ISOLATION_BREACH_DETECTED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {probeResult.verdict}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300">
              <div>Target Keyspace: {probeResult.details?.targetKeyspace}</div>
              <div>Queried Key: {probeResult.details?.queriedKey}</div>
              <div>Cross-Tenant Data Leaked: {probeResult.details?.dataLeaked ? 'YES (CRITICAL)' : 'NO (0% Leakage)'}</div>
              <div className="text-emerald-400 mt-1">Status: {probeResult.details?.crossTenantProtection}</div>
            </div>
          </div>
        )}
      </div>

      {/* The 6 Pillars Breakdown */}
      <div className="space-y-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.number}
            className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col md:flex-row items-start justify-between gap-6"
          >
            <div className="space-y-2.5 max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-300">
                  {pillar.number}
                </span>
                <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                  {pillar.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{pillar.description}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                {pillar.checks.map((check, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    {check}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0 font-mono text-[11px] px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              {pillar.file}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
