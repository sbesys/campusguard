import { TelemetryPoint } from '../types/campus';

export function TelemetryChart({ data }: { data: TelemetryPoint[] }) {
  const width = 560;
  const height = 190;
  const padX = 36;
  const padY = 20;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const toPoints = (getter: (d: TelemetryPoint) => number) =>
    data
      .map((d, i) => {
        const x = padX + (i / Math.max(1, data.length - 1)) * plotW;
        const y = padY + plotH - (getter(d) / 100) * plotH;
        return `${x},${y}`;
      })
      .join(' ');

  const areaPoints = (getter: (d: TelemetryPoint) => number) => {
    const pts = toPoints(getter);
    return `${padX},${padY + plotH} ${pts} ${padX + plotW},${padY + plotH}`;
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Health Score (%)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            Power Load (%)
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
            Network Load (%)
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          24h Sliding Telemetry
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="healthArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[25, 50, 75, 100].map((val) => {
          const y = padY + plotH - (val / 100) * plotH;
          return (
            <g key={val}>
              <line
                x1={padX}
                y1={y}
                x2={padX + plotW}
                y2={y}
                stroke="#162947"
                strokeDasharray="3 3"
              />
              <text
                x={padX - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 font-mono text-[10px]"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area under health */}
        <polygon points={areaPoints((d) => d.healthScore)} fill="url(#healthArea)" />

        {/* Lines */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinejoin="round"
          points={toPoints((d) => d.healthScore)}
        />
        <polyline
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinejoin="round"
          points={toPoints((d) => d.powerLoad)}
        />
        <polyline
          fill="none"
          stroke="#818cf8"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinejoin="round"
          points={toPoints((d) => d.networkLoad)}
        />

        {/* Data points & x-axis labels */}
        {data.map((d, i) => {
          const x = padX + (i / Math.max(1, data.length - 1)) * plotW;
          const yH = padY + plotH - (d.healthScore / 100) * plotH;
          return (
            <g key={d.time}>
              <circle cx={x} cy={yH} r="3.5" fill="#10b981" stroke="#060d1a" strokeWidth="1.5" />
              <text
                x={x}
                y={height - 2}
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[10px]"
              >
                {d.time}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
