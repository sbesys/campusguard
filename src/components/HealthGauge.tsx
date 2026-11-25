export function HealthGauge({
  score,
  size = 156,
  label = 'Operational Health',
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80
      ? { stroke: '#10b981', text: 'text-emerald-400', glow: 'rgba(16,185,129,0.35)' }
      : clamped >= 55
      ? { stroke: '#f59e0b', text: 'text-amber-400', glow: 'rgba(245,158,11,0.35)' }
      : { stroke: '#f43f5e', text: 'text-rose-400', glow: 'rgba(244,63,94,0.4)' };

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#13233f"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease',
            filter: `drop-shadow(0 0 8px ${color.glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`font-mono text-3xl font-bold tracking-tight ${color.text}`}>
          {clamped}%
        </span>
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}
