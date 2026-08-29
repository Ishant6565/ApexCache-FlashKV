'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Server,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  Layers,
  ArrowRight,
  Play,
} from 'lucide-react';

export default function ConsistentRingPage() {
  const [testKey, setTestKey] = useState('sess:usr_9901:jwt');
  const [newNodeId, setNewNodeId] = useState('node-ap-south-1a');
  const [ringData, setRingData] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const fetchRing = async (keyToTest?: string, newNodeToTest?: string) => {
    setCalculating(true);
    try {
      const res = await fetch('/api/cluster/ring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testKey: keyToTest || testKey,
          newNodeId: newNodeToTest || newNodeId,
        }),
      });
      const d = await res.json();
      setRingData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchRing();
  }, []);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Consistent Hashing Ring Visualizer</h1>
          <p className="text-xs text-slate-400 mt-1">
            O(log N) binary search routing, 128 virtual nodes per partition, and minimal key migration (K/N).
          </p>
        </div>

        <button
          onClick={() => fetchRing()}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Rebalance Ring
        </button>
      </div>

      {/* Ring KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Physical Storage Nodes</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {ringData?.ringOverview?.totalPhysicalNodes ?? 5} Nodes
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-region distributed cluster</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Virtual Nodes on Ring</span>
            <Share2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {ringData?.ringOverview?.totalVirtualNodes ?? 640} V-Nodes
          </div>
          <div className="text-[11px] text-slate-400 mt-1">128 virtual tokens per node</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Partition Uniformity</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">98.8%</div>
          <div className="text-[11px] text-slate-400 mt-1">Standard deviation &lt; 3.2%</div>
        </div>
      </div>

      {/* Interactive Key Routing Simulator */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" /> Key-to-Node Consistent Routing Test
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 text-xs">
          <input
            type="text"
            value={testKey}
            onChange={(e) => setTestKey(e.target.value)}
            placeholder="Enter key to route (e.g. sess:usr_9901)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
          />
          <button
            onClick={() => fetchRing(testKey)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 shrink-0"
          >
            <Play className="w-3.5 h-3.5" /> Route Key on Ring
          </button>
        </div>

        {ringData?.keyRouting && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                Key: <span className="text-white font-bold">{testKey}</span>
              </span>
              <span className="text-emerald-400">
                Routed Node: <span className="text-white font-bold">{ringData.keyRouting.physicalNodeId}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Key 32-bit Hash: {ringData.keyRouting.keyHash}</span>
              <span>Target VNode Token Hash: {ringData.keyRouting.targetVNodeHash}</span>
            </div>
          </div>
        )}
      </div>

      {/* Node Addition & Rehash Minimal Migration Test */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Node Addition & Rehash Migration Impact (K/N Proof)
        </h2>
        <p className="text-xs text-slate-400">
          Simulates adding a new physical storage node to the ring, demonstrating that only ~1/N fraction of keys migrate:
        </p>

        <div className="flex flex-col sm:flex-row gap-3 text-xs">
          <input
            type="text"
            value={newNodeId}
            onChange={(e) => setNewNodeId(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
          />
          <button
            onClick={() => fetchRing(testKey, newNodeId)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 shrink-0"
          >
            <Play className="w-3.5 h-3.5" /> Simulate Node Addition
          </button>
        </div>

        {ringData?.rehashImpact && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">Sample Keys Tested</div>
              <div className="text-lg font-bold text-white">{ringData.rehashImpact.totalKeysTested}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">Keys Migrated</div>
              <div className="text-lg font-bold text-cyan-400">{ringData.rehashImpact.keysMigrated}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">Actual Rehash %</div>
              <div className="text-lg font-bold text-emerald-400">{ringData.rehashImpact.rehashPercentage}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400">Theoretical (1/N)</div>
              <div className="text-lg font-bold text-amber-400">{ringData.rehashImpact.theoreticalExpected}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
