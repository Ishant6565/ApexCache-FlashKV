'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Zap,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  FileText,
  Trash2,
  Play,
  Database,
  ArrowRight,
} from 'lucide-react';

export default function LsmTreePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);
  const [compacting, setCompacting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchLsmState = async () => {
    try {
      const res = await fetch('/api/lsm/sstables');
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLsmState();
  }, []);

  const handleFlush = async () => {
    setFlushing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/lsm/flush', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Flush failed');
      setActionMessage(`Flushed ${d.result.flushedCount} entries to L0 SSTable: ${d.result.filename}`);
      await fetchLsmState();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setFlushing(false);
    }
  };

  const handleCompact = async () => {
    setCompacting(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/lsm/compact', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Compaction failed');
      setActionMessage(d.result.message);
      await fetchLsmState();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setCompacting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">LSM-Tree Storage Engine & Compaction</h1>
          <p className="text-xs text-slate-400 mt-1">
            Log-Structured Merge-Tree storage hierarchy: In-Memory MemTable, Immutable L0/L1 SSTables, and Bloom filters.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFlush}
            disabled={flushing}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            {flushing ? 'Flushing...' : 'Flush MemTable → L0'}
          </button>

          <button
            onClick={handleCompact}
            disabled={compacting}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {compacting ? 'Compacting...' : 'Tiered Compaction (L0 → L1)'}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-mono border ${
            actionMessage.startsWith('Error')
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          }`}
        >
          {actionMessage}
        </div>
      )}

      {/* LSM Architecture Flow Diagram */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white">LSM-Tree Write Path & Storage Progression</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span>1. MemTable (In-Memory)</span>
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-slate-400">
              SkipList ordered map backed by append-only Write-Ahead Log (WAL). Sub-microsecond low latency.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>2. L0 SSTables (Disk)</span>
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-slate-400">
              Immutable sorted string files with Bloom filter bitsets for $O(1)$ key membership tests.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>3. L1 Compacted Tier</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-slate-400">
              Size-tiered merged files with all deleted Tombstones purged permanently to recover disk space.
            </p>
          </div>
        </div>
      </div>

      {/* Active SSTables List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" /> Active Immutable SSTable Files
        </h2>

        {data?.sstables?.length > 0 ? (
          <div className="space-y-3 font-mono text-xs">
            {data.sstables.map((s: any) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{s.filename}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.level === 'L0'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {s.level} Tier
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Key Range: <span className="text-slate-200">{s.minKey}</span> →{' '}
                    <span className="text-slate-200">{s.maxKey}</span> • Size: {s.sizeBytes} bytes • Entries:{' '}
                    {s.entryCount}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Bloom Filter: <span className="text-amber-400 font-mono">{s.bloomFilterBits}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400">No active SSTables on disk. Flush MemTable to create L0.</div>
        )}
      </div>

      {/* Write-Ahead Log (WAL) Tail */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" /> Append-Only Write-Ahead Log (WAL) Stream
        </h2>

        <div className="space-y-2 font-mono text-xs">
          {data?.walLogs?.map((w: any) => (
            <div
              key={w.id}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-slate-300"
            >
              <div>
                <span className="text-amber-400 font-bold">WAL #{w.sequenceNumber}</span> • [{w.operation}]{' '}
                <span className="text-white font-semibold">{w.key}</span>
              </div>
              <span className="text-[11px] text-slate-400 truncate max-w-xs">{w.valueSnippet}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
