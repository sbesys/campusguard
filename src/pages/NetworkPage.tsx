import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Flame,
  Info,
  Layers,
  Shield,
} from 'lucide-react';
import { ResourceIcon } from '../components/ResourceIcon';
import { StatusBadge } from '../components/StatusBadge';
import { useCampus } from '../context/CampusContext';
import { ResourceId, StatusLevel } from '../types/campus';

const STATUS_COLORS: Record<
  StatusLevel,
  { stroke: string; fill: string; badgeBg: string; text: string }
> = {
  operational: {
    stroke: '#10b981',
    fill: '#07221d',
    badgeBg: 'rgba(16, 185, 129, 0.16)',
    text: '#6ee7b7',
  },
  degraded: {
    stroke: '#f59e0b',
    fill: '#241a07',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
    text: '#fcd34d',
  },
  critical: {
    stroke: '#f43f5e',
    fill: '#280b14',
    badgeBg: 'rgba(244, 63, 94, 0.2)',
    text: '#fda4af',
  },
};

export function NetworkPage() {
  const { resources, edges, jumpToSimulateResource } = useCampus();
  const [selectedId, setSelectedId] = useState<ResourceId>('electricity');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const resourceMap = useMemo(
    () => new Map(resources.map((r) => [r.id, r])),
    [resources]
  );

  const selectedNode = resourceMap.get(selectedId) ?? resources[0];

  const upstreamEdges = useMemo(
    () => edges.filter((e) => e.to === selectedId),
    [edges, selectedId]
  );
  const downstreamEdges = useMemo(
    () => edges.filter((e) => e.from === selectedId),
    [edges, selectedId]
  );

  const connectedIds = useMemo(() => {
    const set = new Set<ResourceId>([selectedId]);
    upstreamEdges.forEach((e) => set.add(e.from));
    downstreamEdges.forEach((e) => set.add(e.to));
    return set;
  }, [selectedId, upstreamEdges, downstreamEdges]);

  const categories = ['All', 'Core Utility', 'Academic', 'Campus Life', 'Safety & Mobility'];
  const filteredResources = resources.filter(
    (r) => filterCategory === 'All' || r.category === filterCategory
  );

  return (
    <div className="space-y-6">
      {/* Top Interactive Dependency Graph + Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* SVG Network Diagram */}
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">
                Campus Resource Dependency Graph
              </h3>
              <p className="text-xs text-slate-400">
                Click any node to trace upstream constraints and downstream cascading paths
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Operational
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Degraded
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Critical
              </span>
            </div>
          </div>

          <div className="relative overflow-x-auto rounded-xl border border-slate-800/90 bg-[#060e1d] p-2">
            <svg
              viewBox="0 0 900 515"
              className="h-auto min-w-[680px] w-full select-none"
            >
              <defs>
                <marker
                  id="arrow-nominal"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,1 L7,4 L0,7 Z" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrow-degraded"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,1 L7,4 L0,7 Z" fill="#f59e0b" />
                </marker>
                <marker
                  id="arrow-critical"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,1 L7,4 L0,7 Z" fill="#f43f5e" />
                </marker>
                <marker
                  id="arrow-dim"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0,1 L7,4 L0,7 Z" fill="#334155" />
                </marker>
              </defs>

              {/* Tier Column Labels */}
              <text x="130" y="34" textAnchor="middle" className="fill-slate-500 font-mono text-[11px] uppercase tracking-widest">
                Tier 1 • Core Utilities
              </text>
              <text x="450" y="34" textAnchor="middle" className="fill-slate-500 font-mono text-[11px] uppercase tracking-widest">
                Tier 2 • Academic Core
              </text>
              <text x="755" y="34" textAnchor="middle" className="fill-slate-500 font-mono text-[11px] uppercase tracking-widest">
                Tier 3 • Campus Life &amp; Safety
              </text>

              {/* Edges */}
              {edges.map((edge) => {
                const fromNode = resourceMap.get(edge.from);
                const toNode = resourceMap.get(edge.to);
                if (!fromNode || !toNode) return null;

                const isHighlighted =
                  edge.from === selectedId || edge.to === selectedId;

                const sourceStatus = fromNode.status;
                const strokeColor = !isHighlighted
                  ? sourceStatus === 'critical'
                    ? 'rgba(244,63,94,0.3)'
                    : sourceStatus === 'degraded'
                    ? 'rgba(245,158,11,0.3)'
                    : '#1e3354'
                  : sourceStatus === 'critical'
                  ? '#f43f5e'
                  : sourceStatus === 'degraded'
                  ? '#f59e0b'
                  : '#38bdf8';

                const markerId = !isHighlighted
                  ? 'url(#arrow-dim)'
                  : sourceStatus === 'critical'
                  ? 'url(#arrow-critical)'
                  : sourceStatus === 'degraded'
                  ? 'url(#arrow-degraded)'
                  : 'url(#arrow-nominal)';

                // Compute start/end slightly offset from node box edges (box ~148x64)
                const dx = toNode.x - fromNode.x;
                const dy = toNode.y - fromNode.y;
                const angle = Math.atan2(dy, dx);
                const sx = fromNode.x + Math.cos(angle) * 68;
                const sy = fromNode.y + Math.sin(angle) * 28;
                const ex = toNode.x - Math.cos(angle) * 76;
                const ey = toNode.y - Math.sin(angle) * 32;

                // Slight curve for readability when vertical or same-column
                const midX = (sx + ex) / 2 + (Math.abs(dx) < 30 ? 45 : 0);
                const midY = (sy + ey) / 2 - (Math.abs(dy) < 20 ? 18 : 0);

                return (
                  <path
                    key={edge.id}
                    d={`M ${sx} ${sy} Q ${midX} ${midY} ${ex} ${ey}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHighlighted ? 2.4 : 1.3}
                    opacity={isHighlighted ? 1 : 0.55}
                    className={isHighlighted ? 'animate-flow' : ''}
                    markerEnd={markerId}
                  />
                );
              })}

              {/* Resource Nodes */}
              {resources.map((node) => {
                const isSelected = node.id === selectedId;
                const isConnected = connectedIds.has(node.id);
                const palette = STATUS_COLORS[node.status];
                const boxW = 148;
                const boxH = 66;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x - boxW / 2}, ${node.y - boxH / 2})`}
                    onClick={() => setSelectedId(node.id)}
                    className="cursor-pointer transition-opacity"
                    opacity={isConnected ? 1 : 0.45}
                  >
                    {isSelected && (
                      <rect
                        x={-5}
                        y={-5}
                        width={boxW + 10}
                        height={boxH + 10}
                        rx={16}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                      />
                    )}
                    <rect
                      width={boxW}
                      height={boxH}
                      rx={12}
                      fill={palette.fill}
                      stroke={isSelected ? '#22d3ee' : palette.stroke}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                    <circle
                      cx={16}
                      cy={20}
                      r={4.5}
                      fill={palette.stroke}
                    />
                    <text
                      x={27}
                      y={24}
                      className="fill-white text-[12px] font-semibold"
                    >
                      {node.shortName}
                    </text>
                    <text
                      x={14}
                      y={43}
                      className="fill-slate-400 font-mono text-[10px]"
                    >
                      Load: {node.loadPercent}%
                    </text>
                    <rect
                      x={82}
                      y={32}
                      width={56}
                      height={18}
                      rx={9}
                      fill={palette.badgeBg}
                    />
                    <text
                      x={110}
                      y={44}
                      textAnchor="middle"
                      fill={palette.text}
                      className="font-mono text-[9px] font-semibold uppercase"
                    >
                      {node.status === 'operational'
                        ? 'OK'
                        : node.status === 'degraded'
                        ? 'WARN'
                        : 'FAIL'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Node Inspector */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400">
                  <ResourceIcon id={selectedNode.id} className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedNode.name}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedNode.category}</p>
                </div>
              </div>
              <StatusBadge status={selectedNode.status} pulse />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              {selectedNode.description}
            </p>

            {/* Telemetry Specs */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-slate-800 bg-[#071122] p-2.5">
                <div className="text-[10px] uppercase text-slate-400">Capacity</div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-white">
                  {selectedNode.capacityLabel}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#071122] p-2.5">
                <div className="flex items-center gap-1 text-[10px] uppercase text-slate-400">
                  <Clock className="h-3 w-3" /> Failover Buffer
                </div>
                <div className="mt-0.5 font-mono text-xs font-semibold text-cyan-300">
                  {selectedNode.backupBufferMinutes} mins
                </div>
              </div>
              {selectedNode.metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-slate-800 bg-[#071122] p-2.5"
                >
                  <div className="text-[10px] uppercase text-slate-400">{m.label}</div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-slate-100">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Dependencies */}
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  Upstream Constraints ({upstreamEdges.length})
                </h4>
                {upstreamEdges.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Root primary utility — no internal upstream dependencies.
                  </p>
                ) : (
                  <div className="mt-1.5 space-y-1.5">
                    {upstreamEdges.map((e) => {
                      const src = resourceMap.get(e.from);
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelectedId(e.from)}
                          className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-[#071122] px-2.5 py-1.5 text-left text-xs hover:border-cyan-500/40"
                        >
                          <span className="font-medium text-slate-200">
                            {src?.shortName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {e.dependencyType} • {e.bufferMinutes}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                  Downstream Dependents ({downstreamEdges.length})
                </h4>
                {downstreamEdges.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Terminal campus service node.
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {downstreamEdges.map((e) => {
                      const tgt = resourceMap.get(e.to);
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelectedId(e.to)}
                          className="rounded-lg border border-slate-700/80 bg-[#071122] px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300"
                        >
                          {tgt?.shortName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => jumpToSimulateResource(selectedNode.id)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/15 transition hover:brightness-110"
          >
            <Flame className="h-4 w-4" />
            Simulate Failure on {selectedNode.shortName}
          </button>
        </div>
      </div>

      {/* Resource Directory Cards */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">
              Institutional Resource Directory
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  filterCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              onClick={() => setSelectedId(res.id)}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                selectedId === res.id
                  ? 'border-cyan-500/60 bg-[#0d1e3a]'
                  : 'border-slate-800 bg-[#071122] hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-slate-800 p-2 text-cyan-400">
                    <ResourceIcon id={res.id} className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {res.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">{res.location}</p>
                  </div>
                </div>
                <StatusBadge status={res.status} size="xs" />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-slate-500" />
                  {res.ownerUnit}
                </span>
                <span className="font-mono text-slate-200">{res.loadPercent}% load</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
