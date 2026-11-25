import { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowDownRight,
  Building2,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  RotateCcw,
  Users,
  Wrench,
} from 'lucide-react';
import { ResourceIcon } from '../components/ResourceIcon';
import { StatusBadge } from '../components/StatusBadge';
import { SIMULATION_PRESETS } from '../data/campusData';
import { useCampus } from '../context/CampusContext';
import { ResourceId, SimulationResult, StatusLevel } from '../types/campus';

export function SimulationPage() {
  const {
    resources,
    healthScore,
    preselectedSimResource,
    runSimulationPreview,
    applySimulationToTwin,
    resetDigitalTwin,
    setActivePage,
  } = useCampus();

  const [selectedResource, setSelectedResource] =
    useState<ResourceId>(preselectedSimResource);
  const [severity, setSeverity] = useState<Exclude<StatusLevel, 'operational'>>(
    'critical'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(240);
  const [previewResult, setPreviewResult] = useState<SimulationResult | null>(
    null
  );
  const [appliedBanner, setAppliedBanner] = useState(false);

  useEffect(() => {
    setSelectedResource(preselectedSimResource);
  }, [preselectedSimResource]);

  // Run an initial visible preview on mount so the page is immediately rich & interactive
  useEffect(() => {
    const initial = runSimulationPreview(
      selectedResource,
      severity,
      durationMinutes
    );
    setPreviewResult(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunPreview = (
    resId: ResourceId = selectedResource,
    sev: Exclude<StatusLevel, 'operational'> = severity,
    dur: number = durationMinutes
  ) => {
    setAppliedBanner(false);
    const result = runSimulationPreview(resId, sev, dur);
    setPreviewResult(result);
  };

  const handlePresetClick = (presetId: string) => {
    const preset = SIMULATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedResource(preset.resourceId);
    setSeverity(preset.severity);
    setDurationMinutes(preset.durationMinutes);
    handleRunPreview(preset.resourceId, preset.severity, preset.durationMinutes);
  };

  const handleApplyToTwin = () => {
    if (!previewResult) return;
    applySimulationToTwin(previewResult);
    setAppliedBanner(true);
  };

  return (
    <div className="space-y-6">
      {/* Applied Confirmation Banner */}
      {appliedBanner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5 text-sm">
          <div className="flex items-center gap-2.5 text-amber-200">
            <AlertOctagon className="h-5 w-5 text-amber-400" />
            <span>
              <strong>Failure injected into live CampusGuard Twin!</strong> Dashboard, Campus Map, Alerts, and Recovery Planner have been updated.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage('recovery')}
              className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-500/40 hover:bg-cyan-500/30"
            >
              Open Recovery Planner →
            </button>
            <button
              onClick={() => {
                resetDigitalTwin();
                setAppliedBanner(false);
              }}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              Reset Twin
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Control Panel */}
        <div className="space-y-5 rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5 xl:col-span-5">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-white">
              <Flame className="h-4 w-4 text-rose-400" />
              Failure Scenario Configurator
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Select a primary failure point, severity, and outage duration to test constraint buffers.
            </p>
          </div>

          {/* Preset Scenarios */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Quick Demo Scenarios
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {SIMULATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset.id)}
                  className="rounded-xl border border-slate-800 bg-[#071122] p-3 text-left transition hover:border-cyan-500/50 hover:bg-[#0d1b34]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">
                      {preset.name}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                        preset.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {preset.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Resource Selector */}
          <div>
            <label
              htmlFor="sim-resource"
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
            >
              Target Resource Node
            </label>
            <select
              id="sim-resource"
              value={selectedResource}
              onChange={(e) => {
                const next = e.target.value as ResourceId;
                setSelectedResource(next);
                handleRunPreview(next, severity, durationMinutes);
              }}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Buffer: {r.backupBufferMinutes}m)
                </option>
              ))}
            </select>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Failure Severity
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2.5">
              {(['degraded', 'critical'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => {
                    setSeverity(sev);
                    handleRunPreview(selectedResource, sev, durationMinutes);
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold capitalize transition ${
                    severity === sev
                      ? sev === 'critical'
                        ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                        : 'border-amber-500 bg-amber-500/20 text-amber-200'
                      : 'border-slate-800 bg-[#071122] text-slate-400 hover:text-white'
                  }`}
                >
                  {sev === 'critical' ? 'Critical Outage (0%)' : 'Degraded (Partial)'}
                </button>
              ))}
            </div>
          </div>

          {/* Outage Duration Slider */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="sim-duration"
                className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                Outage Duration
              </label>
              <span className="font-mono font-bold text-cyan-300">
                {durationMinutes} mins ({(durationMinutes / 60).toFixed(1)}h)
              </span>
            </div>
            <input
              id="sim-duration"
              type="range"
              min={15}
              max={360}
              step={15}
              value={durationMinutes}
              onChange={(e) => {
                const dur = Number(e.target.value);
                setDurationMinutes(dur);
                handleRunPreview(selectedResource, severity, dur);
              }}
              className="mt-2 w-full accent-cyan-400"
            />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
              <span>15m (Within UPS)</span>
              <span>120m</span>
              <span>360m (6h Exhaustion)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
            <button
              onClick={() => handleRunPreview()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25"
            >
              <Play className="h-4 w-4" />
              Recalculate Cascade
            </button>
            <button
              onClick={handleApplyToTwin}
              disabled={!previewResult}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:brightness-110 disabled:opacity-50"
            >
              <Flame className="h-4 w-4" />
              Apply to Live Twin
            </button>
          </div>
        </div>

        {/* Right Simulation Output */}
        <div className="space-y-5 xl:col-span-7">
          {previewResult && (
            <>
              {/* Impact KPI Header */}
              <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                      Constraint Propagation Forecast
                    </span>
                    <h3 className="mt-1 text-base font-bold text-white">
                      {previewResult.summary}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-[#071122] px-4 py-3">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Current</div>
                      <div className="font-mono text-lg font-bold text-slate-200">
                        {healthScore}%
                      </div>
                    </div>
                    <ArrowDownRight className="h-5 w-5 text-rose-400" />
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Projected</div>
                      <div
                        className={`font-mono text-xl font-bold ${
                          previewResult.projectedHealthScore >= 80
                            ? 'text-emerald-400'
                            : previewResult.projectedHealthScore >= 55
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {previewResult.projectedHealthScore}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-[#071122] p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Activity className="h-3.5 w-3.5 text-rose-400" />
                      Impacted Resources
                    </div>
                    <div className="mt-1 font-mono text-xl font-bold text-white">
                      {previewResult.affectedResourceIds.length} / {resources.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#071122] p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Building2 className="h-3.5 w-3.5 text-amber-400" />
                      Affected Buildings
                    </div>
                    <div className="mt-1 font-mono text-xl font-bold text-white">
                      {previewResult.affectedBuildings.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#071122] p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Users className="h-3.5 w-3.5 text-cyan-400" />
                      Affected Depts
                    </div>
                    <div className="mt-1 font-mono text-xl font-bold text-white">
                      {previewResult.affectedDepartments.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cascading Wave Timeline */}
              <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">
                    Cascading Propagation Waves
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Ordered by constraint wave &amp; buffer exhaustion
                  </span>
                </div>

                <div className="space-y-2.5">
                  {previewResult.waves.map((wave, idx) => (
                    <div
                      key={`${wave.resourceId}-${idx}`}
                      className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-[#071122] p-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-cyan-400">
                          <ResourceIcon id={wave.resourceId} className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cyan-300">
                              WAVE {wave.wave}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {wave.resourceName}
                            </span>
                            <StatusBadge status={wave.resultingStatus} size="xs" />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {wave.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        T+{wave.timeToImpactMinutes}m
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affected Buildings & Departments */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Building2 className="h-4 w-4 text-amber-400" />
                    Affected Buildings ({previewResult.affectedBuildings.length})
                  </h4>
                  {previewResult.affectedBuildings.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      No buildings breached backup thresholds.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {previewResult.affectedBuildings.map((b) => (
                        <div
                          key={b.buildingId}
                          className="rounded-xl border border-slate-800 bg-[#071122] p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">
                              {b.name}
                            </span>
                            <StatusBadge status={b.projectedStatus} size="xs" />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {b.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Users className="h-4 w-4 text-cyan-400" />
                    Impacted Departments ({previewResult.affectedDepartments.length})
                  </h4>
                  {previewResult.affectedDepartments.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Academic &amp; support departments unaffected.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {previewResult.affectedDepartments.map((d) => (
                        <div
                          key={d.department}
                          className="rounded-xl border border-slate-800 bg-[#071122] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white">
                              {d.department}
                            </span>
                            <StatusBadge status={d.status} size="xs" />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">
                            ~{d.headcount.toLocaleString()} personnel • {d.impactSummary}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Tip */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#081326] px-4 py-3 text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-cyan-400" />
                  Applying this simulation generates {previewResult.generatedTasks.length} prioritized SOP recovery tasks.
                </span>
                <button
                  onClick={resetDigitalTwin}
                  className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restore Baseline
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
