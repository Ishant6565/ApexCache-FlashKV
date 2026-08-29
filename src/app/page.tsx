'use client';

import React from 'react';
import Link from 'next/link';
import {
  Database,
  Zap,
  ArrowRight,
  Layers,
  ShieldCheck,
  RotateCcw,
  Activity,
  Cpu,
  Lock,
  Sparkles,
  Server,
  Share2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 selection:bg-amber-500/30">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-600/15 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[400px] bg-cyan-600/10 blur-[130px] rounded-full" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Database className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ApexCache
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-medium">
              FlashKV v3.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg shadow-md shadow-amber-500/30 transition-all font-semibold flex items-center gap-1.5"
            >
              Open KV Workbench <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          Top Product / Core Storage Systems Flagship
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
          Distributed{' '}
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">
            LSM-Tree Key-Value
          </span>{' '}
          Storage Engine
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Ultra-low latency in-memory KV database with <strong>Write-Ahead Logging (WAL)</strong>, tiered <strong>SSTable compaction</strong>, <strong>Consistent Hashing</strong> with 128 virtual nodes, and <strong>Raft consensus</strong> replication.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2"
          >
            Launch Storage Workbench <Zap className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/Ishant6565/ApexCache-FlashKV"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel text-slate-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-all border border-slate-700/80 hover:border-slate-600 flex items-center gap-2"
          >
            View GitHub Repository <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Core Systems Pillars Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Core Distributed Systems & Storage Engineering
          </h2>
          <p className="text-sm text-slate-400">
            Engineered from first principles for high-throughput writes, sub-millisecond reads, and crash-resilient replication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 glass-panel-hover">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">1. LSM-Tree & SSTable Compaction</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              In-Memory MemTable with append-only Write-Ahead Logging (WAL) flushed to immutable L0/L1 SSTables with Bloom filter indexing and tombstone purging.
            </p>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
              RocksDB / LevelDB Storage Model
            </span>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 glass-panel-hover">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">2. Consistent Hash Ring (V = 128)</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Uniform key distribution across storage partitions with O(log N) binary search routing and minimal K/N key migration on node rebalancing.
            </p>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
              Amazon Dynamo / Cassandra Partitioning
            </span>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 glass-panel-hover">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">3. Raft Consensus & Quorums</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Configurable Read/Write quorums (R + W &gt; N Strong Consistency) with automated leader election, heartbeats, and follower log replication.
            </p>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
              etcd / Raft Consensus Protocol
            </span>
          </div>
        </div>
      </section>

      {/* The 6 Security Pillars */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            The 6 Security Pillars (Core Systems & Storage Edition)
          </h2>
          <p className="text-sm text-slate-400">
            Hardened against buffer exhaustion, cross-tenant key leakage, and unauthenticated cluster access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl glass-panel border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <Lock className="w-4 h-4" /> <span className="font-semibold text-xs text-white">1. Secure Auth</span>
            </div>
            <p className="text-xs text-slate-400">Bcrypt 12-round salted hashing, 7-day secure HttpOnly JWT sessions.</p>
          </div>

          <div className="p-5 rounded-xl glass-panel border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <ShieldCheck className="w-4 h-4" /> <span className="font-semibold text-xs text-white">2. Keyspace Partitioning</span>
            </div>
            <p className="text-xs text-slate-400">Multi-tenant keyspace isolation preventing unauthorized cross-tenant reads.</p>
          </div>

          <div className="p-5 rounded-xl glass-panel border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Database className="w-4 h-4" /> <span className="font-semibold text-xs text-white">3. Protected Storage</span>
            </div>
            <p className="text-xs text-slate-400">Server-only storage execution boundaries with clean .env.example.</p>
          </div>

          <div className="p-5 rounded-xl glass-panel border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-rose-400">
              <ShieldCheck className="w-4 h-4" /> <span className="font-semibold text-xs text-white">4. Buffer Overflow Guard</span>
            </div>
            <p className="text-xs text-slate-400">Max key limits (256B) and value payload boundaries (2MB) preventing OOM.</p>
          </div>

          <div className="p-5 rounded-xl glass-panel border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <Activity className="w-4 h-4" /> <span className="font-semibold text-xs text-white">5. IOPS Rate Limiter</span>
            </div>
            <p className="text-xs text-slate-400">Sliding-window read/write throughput limiters on all KV endpoints.</p>
          </div>

          <div className="p-5 rounded-xl glass-panel border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-violet-400">
              <RotateCcw className="w-4 h-4" /> <span className="font-semibold text-xs text-white">6. Immutable WAL Audit</span>
            </div>
            <p className="text-xs text-slate-400">Append-only sequence-indexed write-ahead logs for crash recovery.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Built with <strong>Next.js 15, TypeScript, Prisma, LSM-Tree, Consistent Hashing & Raft</strong>
          </div>
          <div>Resume Project Vault 2026 • Top Product / Core Track</div>
        </div>
      </footer>
    </div>
  );
}
