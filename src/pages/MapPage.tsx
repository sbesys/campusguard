import { useState } from 'react';
import {
  Building2,
  Bus,
  Droplets,
  Flame,
  Layers,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useCampus } from '../context/CampusContext';
import { StatusLevel } from '../types/campus';

type MapLayer = 'all' | 'power' | 'water' | 'fiber' | 'shuttle';

const BUILDING_PALETTE: Record<
  StatusLevel,
  { fill: string; stroke: string; glow: string; dot: string }
> = {
  operational: {
    fill: '#0a2224',
    stroke: '#10b981',
    glow: 'rgba(16,185,129,0.25)',
    dot: '#34d399',
  },
  degraded: {
    fill: '#261c08',
    stroke: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    dot: '#fbbf24',
  },
  critical: {
    fill: '#2b0b15',
    stroke: '#f43f5e',
    glow: 'rgba(244,63,94,0.4)',
    dot: '#fb7185',
  },
};

export function MapPage() {
  const { buildings, resources, jumpToSimulateResource } = useCampus();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    buildings[0]?.id ?? 'bldg-utility'
  );
  const [activeLayer, setActiveLayer] = useState<MapLayer>('all');

  const resourceMap = new Map(resources.map((r) => [r.id, r]));
  const selectedBuilding =
    buildings.find((b) => b.id === selectedBuildingId) ?? buildings[0];

  const powerStatus = resourceMap.get('electricity')?.status ?? 'operational';
  const waterStatus = resourceMap.get('water')?.status ?? 'operational';
  const netStatus = resourceMap.get('internet')?.status ?? 'operational';
  const transStatus = resourceMap.get('transport')?.status ?? 'operational';

  const conduitColor = (st: StatusLevel, nominalHex: string) =>
    st === 'critical' ? '#f43f5e' : st === 'degraded' ? '#f59e0b' : nominalHex;

  return (
    <div className="space-y-6">
      {/* Layer Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/90 bg-[#0a162b] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold text-white">
            Spatial Campus Digital Twin
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            • Click any building footprint to inspect utility feeds &amp; occupancy
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Conduits', icon: Layers },
              { id: 'power', label: '11kV Power', icon: Zap },
              { id: 'water', label: 'Water Mains', icon: Droplets },
              { id: 'fiber', label: 'Fiber Ring', icon: Wifi },
              { id: 'shuttle', label: 'EV Shuttle Loop', icon: Bus },
            ] as const
          ).map((layer) => {
            const Icon = layer.icon;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeLayer === layer.id
                    ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map + Inspector */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Stylized Interactive Campus Map */}
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-4 xl:col-span-2">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#050c18] p-2">
            <svg
              viewBox="0 0 800 480"
              className="h-auto min-w-[620px] w-full select-none"
            >
              {/* Subtle topographic grid */}
              <defs>
                <pattern
                  id="campusGrid"
                  width="32"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 32 0 L 0 0 0 32"
                    fill="none"
                    stroke="#0d1d38"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="800" height="480" fill="url(#campusGrid)" rx="12" />

              {/* Zone Background Labels */}
              <rect
                x="40"
                y="26"
                width="520"
                height="145"
                rx="14"
                fill="rgba(14, 30, 58, 0.35)"
                stroke="#13294b"
                strokeDasharray="4 4"
              />
              <text
                x="55"
                y="45"
                className="fill-slate-500 font-mono text-[10px] uppercase tracking-widest"
              >
                North Research Quad
              </text>

              <rect
                x="40"
                y="180"
                width="680"
                height="140"
                rx="14"
                fill="rgba(14, 30, 58, 0.28)"
                stroke="#13294b"
                strokeDasharray="4 4"
              />
              <text
                x="55"
                y="198"
                className="fill-slate-500 font-mono text-[10px] uppercase tracking-widest"
              >
                Central Academic Core
              </text>

              <rect
                x="80"
                y="330"
                width="640"
                height="130"
                rx="14"
                fill="rgba(14, 30, 58, 0.32)"
                stroke="#13294b"
                strokeDasharray="4 4"
              />
              <text
                x="95"
                y="347"
                className="fill-slate-500 font-mono text-[10px] uppercase tracking-widest"
              >
                South Residential &amp; Wellness Zone
              </text>

              {/* Utility Conduits */}
              {(activeLayer === 'all' || activeLayer === 'power') && (
                <g opacity={activeLayer === 'power' ? 1 : 0.75}>
                  <path
                    d="M 675 170 L 675 250 L 180 250 M 360 250 L 360 150 M 190 150 L 190 250 M 250 250 L 250 350 M 570 250 L 570 350"
                    fill="none"
                    stroke={conduitColor(powerStatus, '#facc15')}
                    strokeWidth={activeLayer === 'power' ? 3 : 2}
                    className="animate-flow"
                  />
                </g>
              )}

              {(activeLayer === 'all' || activeLayer === 'water') && (
                <g opacity={activeLayer === 'water' ? 1 : 0.75}>
                  <path
                    d="M 620 170 L 620 185 L 440 185 L 440 150 M 440 185 L 440 338 L 280 338 L 280 350 M 440 338 L 540 338 L 540 350"
                    fill="none"
                    stroke={conduitColor(waterStatus, '#38bdf8')}
                    strokeWidth={activeLayer === 'water' ? 3 : 2}
                    strokeDasharray="6 4"
                  />
                </g>
              )}

              {(activeLayer === 'all' || activeLayer === 'fiber') && (
                <g opacity={activeLayer === 'fiber' ? 1 : 0.75}>
                  <path
                    d="M 185 150 L 185 172 L 605 172 L 605 205 M 360 172 L 360 195 M 605 300 L 605 350"
                    fill="none"
                    stroke={conduitColor(netStatus, '#a78bfa')}
                    strokeWidth={activeLayer === 'fiber' ? 3 : 2}
                    className="animate-flow"
                  />
                </g>
              )}

              {(activeLayer === 'all' || activeLayer === 'shuttle') && (
                <g opacity={activeLayer === 'shuttle' ? 1 : 0.7}>
                  <rect
                    x="100"
                    y="310"
                    width="595"
                    height="32"
                    rx="16"
                    fill="none"
                    stroke={conduitColor(transStatus, '#34d399')}
                    strokeWidth={activeLayer === 'shuttle' ? 3 : 1.8}
                    strokeDasharray="8 6"
                  />
                </g>
              )}

              {/* Campus Buildings */}
              {buildings.map((b) => {
                const pal = BUILDING_PALETTE[b.status];
                const isSelected = b.id === selectedBuilding.id;
                return (
                  <g
                    key={b.id}
                    onClick={() => setSelectedBuildingId(b.id)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <rect
                        x={b.mapX - 5}
                        y={b.mapY - 5}
                        width={b.mapW + 10}
                        height={b.mapH + 10}
                        rx={14}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={2.5}
                      />
                    )}
                    <rect
                      x={b.mapX}
                      y={b.mapY}
                      width={b.mapW}
                      height={b.mapH}
                      rx={10}
                      fill={pal.fill}
                      stroke={pal.stroke}
                      strokeWidth={isSelected ? 2.2 : 1.6}
                      style={{ filter: `drop-shadow(0 0 8px ${pal.glow})` }}
                    />
                    <circle
                      cx={b.mapX + 16}
                      cy={b.mapY + 18}
                      r={5}
                      fill={pal.dot}
                    />
                    <text
                      x={b.mapX + 27}
                      y={b.mapY + 22}
                      className="fill-cyan-300 font-mono text-[10px] font-bold"
                    >
                      {b.code}
                    </text>
                    <text
                      x={b.mapX + 12}
                      y={b.mapY + 45}
                      className="fill-white text-[12px] font-semibold"
                    >
                      {b.name.length > 22 ? `${b.name.slice(0, 21)}…` : b.name}
                    </text>
                    <text
                      x={b.mapX + 12}
                      y={b.mapY + 66}
                      className="fill-slate-400 font-mono text-[10px]"
                    >
                      Occ: {b.occupancy}/{b.maxOccupancy}
                    </text>
                    <text
                      x={b.mapX + 12}
                      y={b.mapY + 81}
                      className="fill-slate-400 font-mono text-[10px]"
                    >
                      Load: {b.powerLoadKw} kW
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded bg-yellow-400" /> 11kV Grid
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded bg-sky-400" /> Water Main
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded bg-violet-400" /> Core Fiber
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded bg-emerald-400" /> EV Loop
              </span>
            </div>
            <span className="font-mono text-slate-500">
              Apex Campus Sector Grid • 8 Monitored Blocks
            </span>
          </div>
        </div>

        {/* Right Building Inspector */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-[11px] font-semibold text-cyan-400">
                    {selectedBuilding.code} • {selectedBuilding.zone}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {selectedBuilding.name}
                  </h3>
                </div>
              </div>
              <StatusBadge status={selectedBuilding.status} pulse />
            </div>

            <p className="mt-3 rounded-xl border border-slate-800 bg-[#071122] p-3 text-xs leading-relaxed text-slate-300">
              {selectedBuilding.notes}
            </p>

            {/* Occupancy & Power */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-[#071122] p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  Occupancy
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-white">
                  {selectedBuilding.occupancy} / {selectedBuilding.maxOccupancy}
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{
                      width: `${Math.round(
                        (selectedBuilding.occupancy /
                          selectedBuilding.maxOccupancy) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#071122] p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Power Draw
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-white">
                  {selectedBuilding.powerLoadKw} kW
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {selectedBuilding.criticality} Tier
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="mt-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Housed Departments
              </h4>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {selectedBuilding.departments.map((dept) => (
                  <span
                    key={dept}
                    className="rounded-lg border border-slate-700/80 bg-[#071122] px-2.5 py-1 text-xs text-slate-200"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>

            {/* Dependent Resources */}
            <div className="mt-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Utility &amp; Service Dependencies
              </h4>
              <div className="mt-2 space-y-2">
                {selectedBuilding.dependentResources.map((rId) => {
                  const res = resourceMap.get(rId);
                  if (!res) return null;
                  return (
                    <div
                      key={rId}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#071122] px-3 py-2"
                    >
                      <span className="text-xs font-medium text-slate-200">
                        {res.name}
                      </span>
                      <StatusBadge status={res.status} size="xs" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              jumpToSimulateResource(
                selectedBuilding.dependentResources[0] ?? 'electricity'
              )
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
          >
            <Flame className="h-4 w-4" />
            Test Primary Feed Failure
          </button>
        </div>
      </div>
    </div>
  );
}
