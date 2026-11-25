import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCheck,
  Search,
  Trash2,
} from 'lucide-react';
import { SeverityBadge } from '../components/StatusBadge';
import { useCampus } from '../context/CampusContext';
import { AlertSeverity } from '../types/campus';

export function AlertsPage() {
  const { alerts, resources, toggleAcknowledgeAlert, dismissAlert } = useCampus();
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity | 'unack'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const resourceMap = new Map(resources.map((r) => [r.id, r]));

  const filtered = alerts.filter((alert) => {
    const matchesSeverity =
      severityFilter === 'all'
        ? true
        : severityFilter === 'unack'
        ? !alert.acknowledged
        : alert.severity === severityFilter;

    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      q === '' ||
      alert.title.toLowerCase().includes(q) ||
      alert.description.toLowerCase().includes(q) ||
      alert.category.toLowerCase().includes(q);

    return matchesSeverity && matchesQuery;
  });

  const critCount = alerts.filter((a) => a.severity === 'critical').length;
  const warnCount = alerts.filter((a) => a.severity === 'warning').length;
  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* Top Filter & Stats Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800/90 bg-[#0a162b] p-5 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: `All (${alerts.length})` },
              { id: 'unack', label: `Unacknowledged (${unackCount})` },
              { id: 'critical', label: `Critical (${critCount})` },
              { id: 'warning', label: `Warning (${warnCount})` },
              { id: 'info', label: 'Info' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSeverityFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                severityFilter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search risks or resources..."
            className="w-full rounded-xl border border-slate-700 bg-[#071122] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Alert Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0a162b] p-10 text-center">
          <AlertTriangle className="mx-auto h-9 w-9 text-slate-500" />
          <h4 className="mt-3 text-sm font-semibold text-white">
            No Matching Alerts
          </h4>
          <p className="mt-1 text-xs text-slate-400">
            Adjust your filter criteria or run a cascading failure simulation to inspect generated risks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border p-5 transition ${
                alert.severity === 'critical' && !alert.acknowledged
                  ? 'border-rose-500/45 bg-rose-950/15'
                  : alert.severity === 'warning' && !alert.acknowledged
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800/90 bg-[#0a162b]'
              }`}
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      {alert.category}
                    </span>
                    <span className="rounded-md border border-slate-700/80 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                      {alert.source}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      • {alert.timestamp}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">
                    {alert.title}
                  </h4>

                  <p className="max-w-3xl text-xs leading-relaxed text-slate-300">
                    {alert.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">Resources:</span>
                    {alert.affectedResources.map((rId) => (
                      <span
                        key={rId}
                        className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300"
                      >
                        {resourceMap.get(rId)?.shortName ?? rId}
                      </span>
                    ))}
                    {alert.affectedBuildings.length > 0 && (
                      <>
                        <span className="ml-2 text-[11px] text-slate-500">
                          Buildings:
                        </span>
                        {alert.affectedBuildings.slice(0, 4).map((b) => (
                          <span
                            key={b}
                            className="rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-0.5 text-[11px] text-slate-300"
                          >
                            {b}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => toggleAcknowledgeAlert(alert.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                      alert.acknowledged
                        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-cyan-500/40'
                    }`}
                  >
                    {alert.acknowledged ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5" /> Acknowledged
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" /> Acknowledge
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="rounded-xl border border-slate-800 bg-[#071122] p-2 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
                    title="Dismiss alert"
                    aria-label="Dismiss alert"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
