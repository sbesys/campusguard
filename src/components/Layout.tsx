import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Flame,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Network,
  RotateCcw,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { PageId } from '../types/campus';

const NAV_ITEMS: {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
}[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    subtitle: 'Operational overview',
  },
  {
    id: 'network',
    label: 'Resource Network',
    icon: Network,
    subtitle: 'Dependency graph',
  },
  {
    id: 'simulation',
    label: 'Simulation',
    icon: Flame,
    subtitle: 'Cascading failures',
  },
  {
    id: 'recovery',
    label: 'Recovery Planner',
    icon: Wrench,
    subtitle: 'Mitigation & SOPs',
  },
  {
    id: 'map',
    label: 'Campus Map',
    icon: MapIcon,
    subtitle: 'Spatial digital twin',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: AlertTriangle,
    subtitle: 'Active risk feed',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    activePage,
    setActivePage,
    healthScore,
    resources,
    alerts,
    resetDigitalTwin,
    resourceLoading,
    resourceError,
    isSyncing,
    dbWarning,
    clearDbWarning,
  } = useCampus();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unackCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = resources.filter((r) => r.status === 'critical').length;
  const degradedCount = resources.filter((r) => r.status === 'degraded').length;

  const healthColor =
    healthScore >= 80
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : healthScore >= 55
      ? 'text-amber-400 border-amber-500/35 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/40 bg-rose-500/10';

  const currentNav = NAV_ITEMS.find((n) => n.id === activePage) ?? NAV_ITEMS[0];

  const handleSelectPage = (id: PageId) => {
    setActivePage(id);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#060d1a] text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-slate-800/80 bg-[#081226] transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                CampusGuard
              </h1>
              <p className="text-[11px] font-medium text-cyan-400/90">
                Institutional Digital Twin
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Twin Pill */}
        <div className="mx-4 mt-4 rounded-xl border border-slate-800 bg-[#0b1933] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              Twin Engine Live
            </span>
            <span className="font-mono text-[11px] text-slate-400">v2.4</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Campus Health</span>
            <span
              className={`font-mono text-sm font-bold ${
                healthScore >= 80
                  ? 'text-emerald-400'
                  : healthScore >= 55
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {healthScore}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                healthScore >= 80
                  ? 'bg-emerald-500'
                  : healthScore >= 55
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Command Modules
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectPage(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-white ring-1 ring-cyan-500/35'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active
                        ? 'text-cyan-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                {item.id === 'alerts' && unackCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/40">
                    {unackCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Reset & Campus Info */}
        <div className="border-t border-slate-800/80 p-4">
          <button
            onClick={() => void resetDigitalTwin()}
            disabled={isSyncing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-[#0d1c36] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing Twin...' : 'Reset Twin Baseline'}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Apex Institute of Technology • 5,280 Campus Users
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Command Header */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#060d1a]/90 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-800 bg-[#0b172e] p-2 text-slate-300 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">
                  {currentNav.label}
                </h2>
                <span className="hidden rounded-md border border-slate-700/80 bg-slate-800/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400 sm:inline-block">
                  Constraint Twin
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentNav.subtitle}</p>
            </div>
          </div>

          {/* Live Status Telemetry Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${healthColor}`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Health:</span>
              <span className="font-mono font-bold">{healthScore}%</span>
            </div>

            {criticalCount > 0 && (
              <button
                onClick={() => setActivePage('recovery')}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/25"
              >
                <span className="h-2 w-2 animate-ping rounded-full bg-rose-400" />
                {criticalCount} Critical
              </button>
            )}

            {degradedCount > 0 && (
              <button
                onClick={() => setActivePage('alerts')}
                className="hidden items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/15 px-2.5 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/25 sm:flex"
              >
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {degradedCount} Degraded
              </button>
            )}

            <button
              onClick={() => setActivePage('simulation')}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:brightness-110"
            >
              <Flame className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Run Simulation</span>
              <span className="sm:hidden">Simulate</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6">
          {(resourceLoading || resourceError || dbWarning) && (
            <div className="mb-4 space-y-2">
              {resourceLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-200">
                  <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
                  Synchronizing digital twin state with Supabase...
                </div>
              )}
              {resourceError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
                  Supabase resource warning: {resourceError} (displaying fallback dataset)
                </div>
              )}
              {dbWarning && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
                  <span>{dbWarning}</span>
                  <button
                    onClick={clearDbWarning}
                    className="rounded-md px-2 py-0.5 text-[11px] font-medium text-amber-100 hover:bg-amber-500/20"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
