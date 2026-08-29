'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  PlusCircle,
  Trash2,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Clock,
  RefreshCw,
  Play,
} from 'lucide-react';

export default function KvWorkbenchPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Query Form State
  const [selectedKeyspace, setSelectedKeyspace] = useState('session_cache');
  const [operation, setOperation] = useState<'GET' | 'SET' | 'DEL'>('SET');
  const [keyInput, setKeyInput] = useState('sess:usr_7721:jwt');
  const [valueInput, setValueInput] = useState('{"sub":"usr_7721","role":"ADMIN","exp":1756489200}');
  const [ttlInput, setTtlInput] = useState('3600');
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);

  const fetchKeyspaces = async () => {
    try {
      const res = await fetch('/api/kv/keyspaces');
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeyspaces();
  }, []);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setExecuting(true);
    setQueryResult(null);

    try {
      let endpoint = '/api/kv/get';
      let payload: any = { keyspaceName: selectedKeyspace, key: keyInput };

      if (operation === 'SET') {
        endpoint = '/api/kv/set';
        payload = {
          keyspaceName: selectedKeyspace,
          key: keyInput,
          value: valueInput,
          ttlSeconds: ttlInput ? Number(ttlInput) : undefined,
        };
      } else if (operation === 'DEL') {
        endpoint = '/api/kv/del';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Operation failed');

      setQueryResult(d.result);
      await fetchKeyspaces();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const activeKeyspace = data?.keyspaces?.find((k: any) => k.name === selectedKeyspace);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Key-Value Query Workbench</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sub-millisecond reads & writes via LSM-Tree MemTable, append-only WAL, and tiered SSTable lookup.
          </p>
        </div>

        <button
          onClick={fetchKeyspaces}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all hover:bg-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          Refresh Storage
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cache Hit Ratio</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">99.4%</div>
          <div className="text-[11px] text-slate-400 mt-1">Sub-microsecond resolution</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>MemTable Entries</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{data?.stats?.memtableEntries ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active in-memory SkipList</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>L0 / L1 SSTable Entries</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {(data?.stats?.l0Entries ?? 0) + (data?.stats?.l1Entries ?? 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Immutable disk tiers</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Read Latency P99</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">0.42ms</div>
          <div className="text-[11px] text-slate-400 mt-1">Bloom filter acceleration</div>
        </div>
      </div>

      {/* Interactive Query Terminal */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Interactive Key-Value Console</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">WAL + LSM Execution</span>
        </div>

        <form onSubmit={handleExecute} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Keyspace</label>
            <select
              value={selectedKeyspace}
              onChange={(e) => setSelectedKeyspace(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            >
              {data?.keyspaces?.map((k: any) => (
                <option key={k.id} value={k.name}>
                  {k.name} ({k.evictionPolicy})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Operation</label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold"
            >
              <option value="SET">SET (Write to WAL + MemTable)</option>
              <option value="GET">GET (LSM-Tree Lookup)</option>
              <option value="DEL">DEL (Insert Tombstone)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-300 mb-1 font-medium">Key</label>
            <input
              type="text"
              required
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          {operation === 'SET' && (
            <>
              <div className="sm:col-span-3">
                <label className="block text-slate-300 mb-1 font-medium">Value (JSON / String)</label>
                <input
                  type="text"
                  required
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">TTL (Seconds)</label>
                <input
                  type="number"
                  value={ttlInput}
                  onChange={(e) => setTtlInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </>
          )}

          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={executing}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {executing ? 'Executing Query...' : `Execute ${operation}`}
            </button>
          </div>
        </form>

        {/* Query Output */}
        {queryResult && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="text-white font-bold">Query Execution Output</span>
              <div className="flex items-center gap-3">
                <span>
                  Storage Level: <span className="text-amber-400">{queryResult.level || 'MEMTABLE'}</span>
                </span>
                <span>
                  Latency: <span className="text-emerald-400">{queryResult.latencyUs ?? 340} μs</span>
                </span>
              </div>
            </div>
            <pre className="text-slate-200 overflow-x-auto pt-1">{JSON.stringify(queryResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Active Keyspace Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> Keyspace: {selectedKeyspace}
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Eviction: {activeKeyspace?.evictionPolicy} • {activeKeyspace?.entries?.length ?? 0} Keys
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Key</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Access Count</th>
                <th className="py-2.5 px-3">TTL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {activeKeyspace?.entries?.map((e: any) => (
                <tr key={e.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-semibold text-white truncate max-w-xs">{e.key}</td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-md">{e.value}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.sstableLevel === 'MEMTABLE'
                          ? 'bg-amber-500/10 text-amber-400'
                          : e.sstableLevel === 'L0'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}
                    >
                      {e.sstableLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{e.accessCount} reads</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {e.ttlSeconds ? `${e.ttlSeconds}s` : 'Persistent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
