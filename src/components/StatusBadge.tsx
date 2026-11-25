import {
  AlertSeverity,
  RecoveryPriority,
  RecoveryStatus,
  StatusLevel,
} from '../types/campus';

export function StatusBadge({
  status,
  pulse = false,
  size = 'sm',
}: {
  status: StatusLevel;
  pulse?: boolean;
  size?: 'xs' | 'sm' | 'md';
}) {
  const styles: Record<StatusLevel, string> = {
    operational:
      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    degraded:
      'bg-amber-500/15 text-amber-300 border-amber-500/35',
    critical:
      'bg-rose-500/15 text-rose-300 border-rose-500/40',
  };

  const dotColors: Record<StatusLevel, string> = {
    operational: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    critical: 'bg-rose-500',
  };

  const labels: Record<StatusLevel, string> = {
    operational: 'Operational',
    degraded: 'Degraded',
    critical: 'Critical',
  };

  const sizeClass =
    size === 'xs'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${styles[status]} ${sizeClass}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && status !== 'operational' && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotColors[status]}`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${dotColors[status]}`}
        />
      </span>
      {labels[status]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const map: Record<AlertSeverity, { cls: string; label: string }> = {
    critical: {
      cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      label: 'CRITICAL',
    },
    warning: {
      cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      label: 'WARNING',
    },
    info: {
      cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
      label: 'INFO',
    },
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider ${map[severity].cls}`}
    >
      {map[severity].label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: RecoveryPriority }) {
  const cls = priority.startsWith('P0')
    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
    : priority.startsWith('P1')
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
    : 'bg-sky-500/15 text-sky-300 border-sky-500/35';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${cls}`}
    >
      {priority}
    </span>
  );
}

export function RecoveryStatusBadge({ status }: { status: RecoveryStatus }) {
  const map: Record<RecoveryStatus, { cls: string; label: string }> = {
    pending: {
      cls: 'bg-slate-700/50 text-slate-300 border-slate-600/60',
      label: 'Queued',
    },
    in_progress: {
      cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
      label: 'In Progress',
    },
    completed: {
      cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
      label: 'Restored',
    },
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status].cls}`}
    >
      {map[status].label}
    </span>
  );
}
