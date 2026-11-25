import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  INITIAL_ALERTS,
  INITIAL_BUILDINGS,
  INITIAL_RECOVERY_TASKS,
  INITIAL_RESOURCES,
  RESOURCE_EDGES,
  TELEMETRY_HISTORY,
} from '../data/campusData';
import {
  AlertItem,
  Building,
  PageId,
  RecoveryTask,
  ResourceEdge,
  ResourceId,
  ResourceNode,
  SimulationResult,
  StatusLevel,
  TelemetryPoint,
} from '../types/campus';
import {
  calculateHealthScore,
  runCascadingSimulation,
} from '../utils/simulationEngine';

interface CampusContextValue {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  resources: ResourceNode[];
  edges: ResourceEdge[];
  buildings: Building[];
  alerts: AlertItem[];
  recoveryTasks: RecoveryTask[];
  telemetry: TelemetryPoint[];
  healthScore: number;
  lastSimulation: SimulationResult | null;
  preselectedSimResource: ResourceId;
  setPreselectedSimResource: (id: ResourceId) => void;
  runSimulationPreview: (
    resourceId: ResourceId,
    severity: Exclude<StatusLevel, 'operational'>,
    durationMinutes: number
  ) => SimulationResult;
  applySimulationToTwin: (result: SimulationResult) => void;
  advanceRecoveryTask: (taskId: string) => void;
  toggleAcknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  resetDigitalTwin: () => void;
  jumpToSimulateResource: (resourceId: ResourceId) => void;
}

const CampusContext = createContext<CampusContextValue | null>(null);

const STATUS_RANK: Record<StatusLevel, number> = {
  operational: 0,
  degraded: 1,
  critical: 2,
};

function recomputeBuildingsFromResources(
  buildings: Building[],
  resources: ResourceNode[]
): Building[] {
  const resMap = new Map(resources.map((r) => [r.id, r]));
  return buildings.map((b) => {
    let worst: StatusLevel = 'operational';
    const issues: string[] = [];
    for (const rId of b.dependentResources) {
      const node = resMap.get(rId);
      if (!node) continue;
      if (STATUS_RANK[node.status] > STATUS_RANK[worst]) {
        worst = node.status;
      }
      if (node.status !== 'operational') {
        issues.push(`${node.shortName}: ${node.status.toUpperCase()}`);
      }
    }
    return {
      ...b,
      status: worst,
      notes:
        issues.length > 0
          ? `Active constraint impacts — ${issues.join(' | ')}`
          : 'All dependent campus utilities and services nominal.',
    };
  });
}

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [resources, setResources] = useState<ResourceNode[]>(INITIAL_RESOURCES);
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [recoveryTasks, setRecoveryTasks] = useState<RecoveryTask[]>(
    INITIAL_RECOVERY_TASKS
  );
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(TELEMETRY_HISTORY);
  const [lastSimulation, setLastSimulation] = useState<SimulationResult | null>(
    null
  );
  const [preselectedSimResource, setPreselectedSimResource] =
    useState<ResourceId>('electricity');

  const healthScore = useMemo(
    () => calculateHealthScore(resources),
    [resources]
  );

  const runSimulationPreview = (
    resourceId: ResourceId,
    severity: Exclude<StatusLevel, 'operational'>,
    durationMinutes: number
  ): SimulationResult => {
    const result = runCascadingSimulation(
      resources,
      RESOURCE_EDGES,
      buildings,
      resourceId,
      severity,
      durationMinutes
    );
    setLastSimulation(result);
    return result;
  };

  const applySimulationToTwin = (result: SimulationResult) => {
    const waveMap = new Map(
      result.waves.map((w) => [w.resourceId, w.resultingStatus])
    );

    const nextResources: ResourceNode[] = resources.map((r) => {
      const nextStatus = waveMap.get(r.id);
      if (!nextStatus) return r;
      const loadBoost =
        nextStatus === 'critical' ? 98 : Math.min(95, r.loadPercent + 16);
      return {
        ...r,
        status:
          STATUS_RANK[nextStatus] > STATUS_RANK[r.status]
            ? nextStatus
            : r.status,
        loadPercent: loadBoost,
      };
    });

    const nextBuildings = recomputeBuildingsFromResources(
      buildings,
      nextResources
    );

    const triggerNode = resources.find(
      (r) => r.id === result.triggerResourceId
    );
    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newAlerts: AlertItem[] = [
      {
        id: `sim-alert-${Date.now()}`,
        title: `Simulated ${result.triggerSeverity.toUpperCase()}: ${triggerNode?.name ?? result.triggerResourceId}`,
        severity: result.triggerSeverity === 'critical' ? 'critical' : 'warning',
        timestamp: 'Just now',
        category: 'Cascading Simulation',
        affectedResources: result.affectedResourceIds,
        affectedBuildings: result.affectedBuildings.map((b) => b.name),
        description: result.summary,
        acknowledged: false,
        source: 'Simulation Engine',
      },
      ...result.waves
        .filter((w) => w.wave > 0)
        .slice(0, 3)
        .map((w, idx) => ({
          id: `sim-cascade-${Date.now()}-${idx}`,
          title: `Cascading Impact (Wave ${w.wave}): ${w.resourceName}`,
          severity: (w.resultingStatus === 'critical'
            ? 'critical'
            : 'warning') as AlertItem['severity'],
          timestamp: 'Just now',
          category: 'Dependency Breach',
          affectedResources: [w.resourceId],
          affectedBuildings: buildings
            .filter((b) => b.dependentResources.includes(w.resourceId))
            .map((b) => b.name),
          description: w.reason,
          acknowledged: false,
          source: 'Simulation Engine' as const,
        })),
    ];

    const newTasks: RecoveryTask[] = result.generatedTasks.map((t, idx) => ({
      ...t,
      id: `rec-sim-${Date.now()}-${idx}`,
      status: idx === 0 ? 'in_progress' : 'pending',
    }));

    const nextScore = calculateHealthScore(nextResources);
    const powerLoad =
      nextResources.find((r) => r.id === 'electricity')?.loadPercent ?? 72;
    const netLoad =
      nextResources.find((r) => r.id === 'internet')?.loadPercent ?? 64;

    setResources(nextResources);
    setBuildings(nextBuildings);
    setAlerts((prev) => [...newAlerts, ...prev]);
    setRecoveryTasks((prev) => {
      const existingIds = new Set(newTasks.map((t) => t.resourceId));
      const kept = prev.filter((t) => !existingIds.has(t.resourceId));
      return [...newTasks, ...kept];
    });
    setTelemetry((prev) => [
      ...prev.slice(-7),
      {
        time: nowLabel,
        healthScore: nextScore,
        powerLoad,
        networkLoad: netLoad,
      },
    ]);
  };

  const advanceRecoveryTask = (taskId: string) => {
    const target = recoveryTasks.find((t) => t.id === taskId);
    if (!target) return;

    const nextTaskStatus =
      target.status === 'pending'
        ? 'in_progress'
        : target.status === 'in_progress'
        ? 'completed'
        : 'completed';

    setRecoveryTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextTaskStatus } : t))
    );

    if (nextTaskStatus === 'completed') {
      const baselineRes = INITIAL_RESOURCES.find(
        (r) => r.id === target.resourceId
      );
      const nextResources = resources.map((r) =>
        r.id === target.resourceId
          ? {
              ...r,
              status: 'operational' as StatusLevel,
              loadPercent: baselineRes ? Math.min(baselineRes.loadPercent, 74) : 65,
            }
          : r
      );
      const nextBuildings = recomputeBuildingsFromResources(
        buildings,
        nextResources
      );
      setResources(nextResources);
      setBuildings(nextBuildings);

      setAlerts((prev) =>
        prev.map((a) =>
          a.affectedResources.includes(target.resourceId)
            ? { ...a, acknowledged: true }
            : a
        )
      );

      const nextScore = calculateHealthScore(nextResources);
      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setTelemetry((prev) => [
        ...prev.slice(-7),
        {
          time: nowLabel,
          healthScore: nextScore,
          powerLoad:
            nextResources.find((r) => r.id === 'electricity')?.loadPercent ?? 70,
          networkLoad:
            nextResources.find((r) => r.id === 'internet')?.loadPercent ?? 60,
        },
      ]);
    }
  };

  const toggleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, acknowledged: !a.acknowledged } : a
      )
    );
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const resetDigitalTwin = () => {
    setResources(INITIAL_RESOURCES);
    setBuildings(INITIAL_BUILDINGS);
    setAlerts(INITIAL_ALERTS);
    setRecoveryTasks(INITIAL_RECOVERY_TASKS);
    setTelemetry(TELEMETRY_HISTORY);
    setLastSimulation(null);
  };

  const jumpToSimulateResource = (resourceId: ResourceId) => {
    setPreselectedSimResource(resourceId);
    setActivePage('simulation');
  };

  return (
    <CampusContext.Provider
      value={{
        activePage,
        setActivePage,
        resources,
        edges: RESOURCE_EDGES,
        buildings,
        alerts,
        recoveryTasks,
        telemetry,
        healthScore,
        lastSimulation,
        preselectedSimResource,
        setPreselectedSimResource,
        runSimulationPreview,
        applySimulationToTwin,
        advanceRecoveryTask,
        toggleAcknowledgeAlert,
        dismissAlert,
        resetDigitalTwin,
        jumpToSimulateResource,
      }}
    >
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const ctx = useContext(CampusContext);
  if (!ctx) {
    throw new Error('useCampus must be used within a CampusProvider');
  }
  return ctx;
}
