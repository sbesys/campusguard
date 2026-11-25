import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Cpu,
  Flame,
  ShieldAlert,
  Wrench,
  Zap,
} from 'lucide-react';
import { HealthGauge } from '../components/HealthGauge';
import { ResourceIcon } from '../components/ResourceIcon';
import { SeverityBadge, StatusBadge } from '../components/StatusBadge';
import { TelemetryChart } from '../components/TelemetryChart';
import { SIMULATION_PRESETS } from '../data/campusData';
import { useCampus } from '../context/CampusContext';

export function DashboardPage() {
  const {
    healthScore,
    resources,
    buildings,
    alerts,
    recoveryTasks,
    telemetry,
    setActivePage,
    runSimulationPreview,
    applySimulationToTwin,
  } = useCampus();

  const onlineBuildings = buildings.filter((b) => b.status === 'operational').length;
  const affectedBuildings = buildings.length - onlineBuildings;
  const activeFailures = resources.filter((r) => r.status === 'critical').length;
  const degradedResources = resources.filter((r) => r.status === 'degraded').length;
  const unackAlerts = alerts.filter((a) => !a.acknowledged).length;
  const openRecovery = recoveryTasks.filter((t) => t.status !== 'completed').length;

  const totalPowerKw = buildings.reduce((sum, b) => sum + b.powerLoadKw, 0);
  const totalOccupancy = buildings.reduce((sum, b) => sum + b.occupancy, 0);

  const handleQuickDemoIncident = (presetId: string) => {
    const preset = SIMULATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const result = runSimulationPreview(
      preset.resourceId,
      preset.severity,
      preset.durationMinutes
    );
    applySimulationToTwin(result);
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Health Score Card */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5 shadow-lg">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Institutional Health
            </p>
            <h3 className="mt-1 text-2xl font-bold text-white">
              {healthScore >= 80
                ? 'Nominal'
                : healthScore >= 55
                ? 'Strained'
                : 'Critical Risk'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {resources.filter((r) => r.status === 'operational').length}/
              {resources.length} systems optimal
            </p>
            <button
              onClick={() => setActivePage('network')}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Inspect dependencies <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <HealthGauge score={healthScore} size={108} label="Score" />
        </div>

        {/* Buildings Card */}
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Campus Buildings
            </span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white">
              {onlineBuildings}/{buildings.length}
            </span>
            <span className="text-xs text-emerald-400">Fully Operational</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {affectedBuildings > 0
              ? `${affectedBuildings} building(s) under resource constraint`
              : 'All campus zones operating within bounds'}
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
            <span className="text-slate-400">
              Occupancy: <strong className="text-slate-200">{totalOccupancy.toLocaleString()}</strong>
            </span>
            <button
              onClick={() => setActivePage('map')}
              className="font-medium text-cyan-400 hover:text-cyan-300"
            >
              Open Map →
            </button>
          </div>
        </div>

        {/* Active Failures Card */}
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Active Failures &amp; Risks
            </span>
            <div
              className={`rounded-lg p-2 ${
                activeFailures > 0
                  ? 'bg-rose-500/15 text-rose-400'
                  : degradedResources > 0
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-bold text-white">
              {activeFailures}
            </span>
            <span className="text-xs font-medium text-rose-400">Critical</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-xl font-bold text-amber-400">
              {degradedResources}
            </span>
            <span className="text-xs font-medium text-amber-400">Degraded</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {unackAlerts} unacknowledged alert(s) • {openRecovery} open recovery task(s)
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
            <span className="text-slate-400">
              Grid Draw: <strong className="font-mono text-slate-200">{(totalPowerKw / 1000).toFixed(2)} MW</strong>
            </span>
            <button
              onClick={() => setActivePage('recovery')}
              className="font-medium text-cyan-400 hover:text-cyan-300"
            >
              Recovery Plan →
            </button>
          </div>
        </div>

        {/* Quick Cascading Simulation Sandbox Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#0c1c38] to-[#081326] p-5 shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                Live Twin Stress Test
              </span>
              <Flame className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Trigger a realistic failure scenario to observe cascading effects across campus systems.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickDemoIncident('preset-blackout')}
              className="flex-1 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
            >
              Simulate Blackout
            </button>
            <button
              onClick={() => setActivePage('simulation')}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
            >
              Custom Lab
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Telemetry Graph & Recent Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-white">
                Campus Resilience &amp; Resource Load Telemetry
              </h3>
              <p className="text-xs text-slate-400">
                Tracks institutional health against electrical and core network utilization
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] text-emerald-300">
              <Cpu className="h-3 w-3" /> Real-time Twin
            </span>
          </div>
          <TelemetryChart data={telemetry} />
        </div>

        {/* Alerts Summary */}
        <div className="flex flex-col rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-semibold text-white">
                Priority Alerts
              </h3>
            </div>
            <button
              onClick={() => setActivePage('alerts')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              View all ({alerts.length})
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                onClick={() => setActivePage('alerts')}
                className="cursor-pointer rounded-xl border border-slate-800 bg-[#071020] p-3 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <SeverityBadge severity={alert.severity} />
                  <span className="font-mono text-[11px] text-slate-500">
                    {alert.timestamp}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-slate-100 line-clamp-1">
                  {alert.title}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                  {alert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Status Grid */}
      <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-white">
              Critical Resource Status Matrix
            </h3>
            <p className="text-xs text-slate-400">
              All 9 interconnected institutional infrastructure nodes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage('network')}
              className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/40"
            >
              View Network Graph
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => (
            <div
              key={res.id}
              className={`rounded-xl border p-4 transition ${
                res.status === 'critical'
                  ? 'border-rose-500/45 bg-rose-950/20'
                  : res.status === 'degraded'
                  ? 'border-amber-500/40 bg-amber-950/15'
                  : 'border-slate-800 bg-[#071122] hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`rounded-lg p-2 ${
                      res.status === 'critical'
                        ? 'bg-rose-500/20 text-rose-400'
                        : res.status === 'degraded'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-cyan-500/15 text-cyan-400'
                    }`}
                  >
                    <ResourceIcon id={res.id} className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {res.shortName}
                    </h4>
                    <p className="text-[11px] text-slate-400">{res.capacityLabel}</p>
                  </div>
                </div>
                <StatusBadge status={res.status} pulse size="xs" />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current Load</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {res.loadPercent}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      res.status === 'critical'
                        ? 'bg-rose-500'
                        : res.status === 'degraded'
                        ? 'bg-amber-400'
                        : res.loadPercent > 80
                        ? 'bg-cyan-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${res.loadPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Building Operational Table & Active Recovery Preview */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                Building Readiness &amp; Constraint Exposure
              </h3>
              <p className="text-xs text-slate-400">
                Real-time operational posture across academic, residential, and medical blocks
              </p>
            </div>
            <button
              onClick={() => setActivePage('map')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Interactive Map →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="pb-2.5 pr-4 font-semibold">Building</th>
                  <th className="pb-2.5 pr-4 font-semibold">Zone</th>
                  <th className="pb-2.5 pr-4 font-semibold">Occupancy</th>
                  <th className="pb-2.5 pr-4 font-semibold">Draw</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {buildings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-slate-100">{b.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {b.code} • {b.criticality}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-300">{b.zone}</td>
                    <td className="py-2.5 pr-4 font-mono text-slate-300">
                      {b.occupancy}/{b.maxOccupancy}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-cyan-300">
                      <span className="inline-flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {b.powerLoadKw} kW
                      </span>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={b.status} pulse size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recovery Action Preview */}
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-cyan-400" />
              <h3 className="text-base font-semibold text-white">
                Active Recovery Queue
              </h3>
            </div>
            <button
              onClick={() => setActivePage('recovery')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Manage →
            </button>
          </div>
          {recoveryTasks.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#071122] p-6 text-center text-xs text-slate-400">
              No active recovery interventions queued.
            </div>
          ) : (
            <div className="space-y-3">
              {recoveryTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-800 bg-[#071122] p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-cyan-400">
                      {task.priority}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase text-slate-300">
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-white">
                    {task.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {task.assignedTeam} • Est. {task.estimatedMinutes} min
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
