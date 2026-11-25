import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Play,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { ResourceIcon } from '../components/ResourceIcon';
import {
  PriorityBadge,
  RecoveryStatusBadge,
  StatusBadge,
} from '../components/StatusBadge';
import { useCampus } from '../context/CampusContext';

export function RecoveryPage() {
  const {
    recoveryTasks,
    resources,
    healthScore,
    advanceRecoveryTask,
    setActivePage,
  } = useCampus();
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const resourceMap = new Map(resources.map((r) => [r.id, r]));

  const pendingCount = recoveryTasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = recoveryTasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = recoveryTasks.filter((t) => t.status === 'completed').length;

  const potentialGain = recoveryTasks
    .filter((t) => t.status !== 'completed')
    .reduce((sum, t) => sum + t.healthGainEstimate, 0);

  const visibleTasks = recoveryTasks.filter((t) => {
    if (filterStatus === 'active') return t.status !== 'completed';
    if (filterStatus === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Recovery KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-4">
          <div className="text-xs font-medium text-slate-400">Queued Actions</div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            {pendingCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Awaiting crew dispatch</div>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-4">
          <div className="text-xs font-medium text-slate-400">In Progress</div>
          <div className="mt-2 font-mono text-2xl font-bold text-cyan-400">
            {inProgressCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Field teams active</div>
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-[#0a162b] p-4">
          <div className="text-xs font-medium text-slate-400">Restored Systems</div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            {completedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Verified operational</div>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-[#0c1c38] p-4">
          <div className="flex items-center justify-between text-xs font-medium text-cyan-300">
            <span>Projected Recovery</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            {Math.min(100, healthScore + potentialGain)}%
          </div>
          <div className="mt-1 text-[11px] text-cyan-200/80">
            +{Math.min(100 - healthScore, potentialGain)} pts upon plan completion
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/90 bg-[#0a162b] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Prioritized Restoration Runbooks
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                filterStatus === tab
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0a162b] p-10 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-400" />
          <h4 className="mt-3 text-base font-semibold text-white">
            All Recovery Tasks Completed
          </h4>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Institutional resources are operating smoothly. Run a failure simulation to generate and test emergency recovery SOPs.
          </p>
          <button
            onClick={() => setActivePage('simulation')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/40 hover:bg-cyan-500/30"
          >
            <Flame className="h-4 w-4" />
            Launch Failure Simulation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleTasks.map((task) => {
            const res = resourceMap.get(task.resourceId);
            return (
              <div
                key={task.id}
                className={`rounded-2xl border p-5 transition ${
                  task.status === 'completed'
                    ? 'border-emerald-500/25 bg-[#081726]/70'
                    : 'border-slate-800/90 bg-[#0a162b]'
                }`}
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`mt-0.5 rounded-xl p-2.5 ${
                        task.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-cyan-500/15 text-cyan-400'
                      }`}
                    >
                      <ResourceIcon id={task.resourceId} className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <RecoveryStatusBadge status={task.status} />
                        {res && <StatusBadge status={res.status} size="xs" />}
                      </div>

                      <h4 className="mt-2 text-base font-bold text-white">
                        {task.title}
                      </h4>

                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          {task.assignedTeam}
                        </span>
                        <span className="flex items-center gap-1.5 font-mono">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          Est. {task.estimatedMinutes} min RTO
                        </span>
                        <span className="font-mono text-emerald-400">
                          +{task.healthGainEstimate}% Health Impact
                        </span>
                      </div>

                      {/* Affected Buildings */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-500">
                          Impacted Blocks:
                        </span>
                        {task.affectedBuildings.map((bName) => (
                          <span
                            key={bName}
                            className="rounded-md border border-slate-800 bg-[#071122] px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            {bName}
                          </span>
                        ))}
                      </div>

                      {/* Suggestions */}
                      <div className="mt-4 rounded-xl border border-slate-800/80 bg-[#071122] p-3.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Recommended Mitigation Steps
                        </div>
                        <ul className="mt-2 space-y-1.5">
                          {task.suggestions.map((step, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-slate-300"
                            >
                              <span className="mt-0.5 font-mono text-[10px] font-bold text-cyan-400">
                                0{i + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="flex shrink-0 flex-row items-center gap-2 lg:flex-col lg:items-end">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => advanceRecoveryTask(task.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:brightness-110"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Dispatch Crew
                      </button>
                    )}

                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => advanceRecoveryTask(task.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:brightness-110"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete &amp; Restore Node
                      </button>
                    )}

                    {task.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Service Restored
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
