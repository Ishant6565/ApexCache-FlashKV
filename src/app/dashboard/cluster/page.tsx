'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

export default function ClusterQuorumPage() {
  const [clusterData, setClusterData] = useState<any>(null);
  const [readQuorum, setReadQuorum] = useState<number>(2);
  const [writeQuorum, setWriteQuorum] = useState<number>(2);
  const [replicationFactor, setReplicationFactor] = useState<number>(3);
  const [electing, setElecting] = useState(false);
  const [electionResult, setElectionResult] = useState<any>(null);

  const fetchCluster = async (r?: number, w?: number, n?: number) => {
    try {
      const res = await fetch('/api/cluster/quorum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readQuorum: r ?? readQuorum,
          writeQuorum: w ?? writeQuorum,
          replicationFactor: n ?? replicationFactor,
        }),
      });
      const d = await res.json();
      setClusterData(d.status);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCluster();
  }, []);

  const handleTriggerElection = async () => {
    setElecting(true);
    setElectionResult(null);
    try {
      const res = await fetch('/api/cluster/elect-leader', { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Election failed');
      setElectionResult(d.result);
      await fetchCluster();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setElecting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Raft Consensus & Quorum Studio</h1>
          <p className="text-xs text-slate-400 mt-1">
            Distributed storage node cluster, automated leader election, and tunable $R + W &gt; N$ Quorum Consistency.
          </p>
        </div>

        <button
          onClick={handleTriggerElection}
          disabled={electing}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${electing ? 'animate-spin' : ''}`} />
          {electing ? 'Electing New Leader...' : 'Trigger Raft Failover Election'}
        </button>
      </div>

      {electionResult && (
        <div className="p-3 rounded-xl text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          Leader Failover Consensus Reached! New Cluster Leader: <span className="font-bold">{electionResult.newLeader}</span> (Term: {electionResult.term})
        </div>
      )}

      {/* Quorum Consistency Configurator */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Tunable Quorum Consistency (R + W &gt; N)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Replication Factor (N)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={replicationFactor}
              onChange={(e) => {
                const val = Number(e.target.value);
                setReplicationFactor(val);
                fetchCluster(readQuorum, writeQuorum, val);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Read Quorum (R)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={readQuorum}
              onChange={(e) => {
                const val = Number(e.target.value);
                setReadQuorum(val);
                fetchCluster(val, writeQuorum, replicationFactor);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Write Quorum (W)</label>
            <input
              type="number"
              min="1"
              max="5"
              value={writeQuorum}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWriteQuorum(val);
                fetchCluster(readQuorum, val, replicationFactor);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
        </div>

        {clusterData?.quorum && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Evaluated Consistency Model:</span>{' '}
              <span
                className={`font-bold ${
                  clusterData.quorum.isStrictlyConsistent ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {clusterData.quorum.consistencyModel}
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                clusterData.quorum.isStrictlyConsistent
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {clusterData.quorum.isStrictlyConsistent ? 'STRONG_CONSISTENCY' : 'EVENTUAL_CONSISTENCY'}
            </span>
          </div>
        )}
      </div>

      {/* Storage Nodes List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" /> Distributed Storage Nodes (Heartbeat Monitor)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
          {clusterData?.nodes?.map((node: any) => (
            <div
              key={node.id}
              className={`p-4 rounded-xl border space-y-2 ${
                node.status === 'LEADER'
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{node.nodeId}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    node.status === 'LEADER'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {node.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Endpoint: {node.host}:{node.port}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Ring Position: {node.ringPosition}°</span>
                <span className="text-emerald-400">Heartbeat: {node.lastHeartbeatMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
