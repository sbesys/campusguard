import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  INITIAL_ALERTS,
  INITIAL_BUILDINGS,
  INITIAL_RECOVERY_TASKS,
  INITIAL_RESOURCES,
  RESOURCE_EDGES,
  SIMULATION_PRESETS,
  TELEMETRY_HISTORY,
} from '../data/campusData';
import {
  acknowledgeResourceAlertsInDb,
  deleteAlertFromDb,
  fetchAllCampusData,
  insertAlertsToDb,
  insertSimulationRecord,
  insertTelemetryPointInDb,
  resetTwinBaselineInDb,
  syncRecoveryTasksFromSimulation,
  updateAlertAckInDb,
  updateChangedBuildings,
  updateChangedResources,
  updateRecoveryTaskStatusInDb,
} from '../services/campusDb';
import {
  AlertItem,
  Building,
  PageId,
  RecoveryTask,
  ResourceEdge,
  ResourceId,
  ResourceNode,
  SimulationPreset,
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
  resourceLoading: boolean;
  resourceError: string | null;
  isSyncing: boolean;
  dbWarning: string | null;
  clearDbWarning: () => void;
  edges: ResourceEdge[];
  buildings: Building[];
  alerts: AlertItem[];
  recoveryTasks: RecoveryTask[];
  simulationPresets: SimulationPreset[];
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
  applySimulationToTwin: (result: SimulationResult) => Promise<void>;
  advanceRecoveryTask: (taskId: string) => Promise<void>;
  toggleAcknowledgeAlert: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  resetDigitalTwin: () => Promise<void>;
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
  const [resourceLoading, setResourceLoading] = useState(true);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbWarning, setDbWarning] = useState<string | null>(null);

  const [edges, setEdges] = useState<ResourceEdge[]>(RESOURCE_EDGES);
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [recoveryTasks, setRecoveryTasks] = useState<RecoveryTask[]>(
    INITIAL_RECOVERY_TASKS
  );
  const [simulationPresets, setSimulationPresets] =
    useState<SimulationPreset[]>(SIMULATION_PRESETS);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(TELEMETRY_HISTORY);
  const [lastSimulation, setLastSimulation] = useState<SimulationResult | null>(
    null
  );
  const [preselectedSimResource, setPreselectedSimResource] =
    useState<ResourceId>('electricity');

  const syncLockRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromSupabase() {
      try {
        const hydrated = await fetchAllCampusData();
        if (cancelled) return;

        if (hydrated.resources) {
          setResources(hydrated.resources);
        }
        setResourceError(hydrated.resourceError);

        if (hydrated.buildings) {
          setBuildings(hydrated.buildings);
        }
        if (hydrated.edges) {
          setEdges(hydrated.edges);
        }
        if (hydrated.alerts) {
          setAlerts(hydrated.alerts);
        }
        if (hydrated.recoveryTasks) {
          setRecoveryTasks(hydrated.recoveryTasks);
        }
        if (hydrated.presets) {
          setSimulationPresets(hydrated.presets);
        }
        if (hydrated.telemetry) {
          setTelemetry(hydrated.telemetry);
        }

        if (hydrated.warnings.length > 0) {
          setDbWarning(hydrated.warnings[0]);
        }
      } catch (err) {
        if (!cancelled) {
          setResourceError(
            err instanceof Error
              ? err.message
              : 'Unable to load CampusGuard data from Supabase'
          );
        }
      } finally {
        if (!cancelled) {
          setResourceLoading(false);
        }
      }
    }

    hydrateFromSupabase();

    return () => {
      cancelled = true;
    };
  }, []);

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
      edges,
      buildings,
      resourceId,
      severity,
      durationMinutes
    );
    setLastSimulation(result);
    return result;
  };

  const applySimulationToTwin = async (result: SimulationResult) => {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setIsSyncing(true);
    setDbWarning(null);

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

    const changedResources = nextResources.filter((r, i) => {
      const prev = resources[i];
      return prev.status !== r.status || prev.loadPercent !== r.loadPercent;
    });

    const nextBuildings = recomputeBuildingsFromResources(
      buildings,
      nextResources
    );

    const changedBuildings = nextBuildings.filter((b, i) => {
      const prev = buildings[i];
      return prev.status !== b.status || prev.notes !== b.notes;
    });

    const triggerNode = resources.find(
      (r) => r.id === result.triggerResourceId
    );
    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const tempPrefix = `temp-${Date.now()}`;
    const newAlertsDraft: AlertItem[] = [
      {
        id: `${tempPrefix}-root`,
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
          id: `${tempPrefix}-wave-${idx}`,
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

    const newTasksDraft: RecoveryTask[] = result.generatedTasks.map((t, idx) => ({
      ...t,
      id: `${tempPrefix}-task-${idx}`,
      status: idx === 0 ? 'in_progress' : 'pending',
    }));

    const nextScore = calculateHealthScore(nextResources);
    const powerLoad =
      nextResources.find((r) => r.id === 'electricity')?.loadPercent ?? 72;
    const netLoad =
      nextResources.find((r) => r.id === 'internet')?.loadPercent ?? 64;

    const newPoint: TelemetryPoint = {
      time: nowLabel,
      healthScore: nextScore,
      powerLoad,
      networkLoad: netLoad,
    };

    // Optimistic UI updates
    setResources(nextResources);
    setBuildings(nextBuildings);
    setAlerts((prev) => [...newAlertsDraft, ...prev]);
    setRecoveryTasks((prev) => {
      const existingIds = new Set(newTasksDraft.map((t) => t.resourceId));
      const kept = prev.filter((t) => !existingIds.has(t.resourceId));
      return [...newTasksDraft, ...kept];
    });
    setTelemetry((prev) => [...prev.slice(-7), newPoint]);

    // Persist changes to Supabase
    try {
      const warnings: string[] = [];

      const [simErr, resErr, bldgErr, alertsRes, tasksRes, telRes] =
        await Promise.all([
          insertSimulationRecord(result),
          updateChangedResources(changedResources),
          updateChangedBuildings(changedBuildings),
          insertAlertsToDb(newAlertsDraft),
          syncRecoveryTasksFromSimulation(newTasksDraft, recoveryTasks),
          insertTelemetryPointInDb(newPoint),
        ]);

      if (simErr) warnings.push(simErr);
      if (resErr) warnings.push(resErr);
      if (bldgErr) warnings.push(bldgErr);
      if (alertsRes.error) warnings.push(alertsRes.error);
      if (tasksRes.error) warnings.push(tasksRes.error);
      if (telRes.error) warnings.push(telRes.error);

      // Replace optimistic temp alert IDs with persisted UUIDs
      if (alertsRes.rows.length > 0) {
        const tempIds = new Set(newAlertsDraft.map((a) => a.id));
        setAlerts((prev) => [
          ...alertsRes.rows,
          ...prev.filter((a) => !tempIds.has(a.id)),
        ]);
      }

      if (!tasksRes.error && tasksRes.tasks.length > 0) {
        setRecoveryTasks(tasksRes.tasks);
      }

      if (telRes.point) {
        setTelemetry((prev) => [
          ...prev.slice(0, -1),
          telRes.point!,
        ]);
      }

      if (warnings.length > 0) {
        setDbWarning(warnings[0]);
      }
    } catch (err) {
      setDbWarning(
        err instanceof Error
          ? err.message
          : 'Failed to persist simulation changes to Supabase.'
      );
    } finally {
      syncLockRef.current = false;
      setIsSyncing(false);
    }
  };

  const advanceRecoveryTask = async (taskId: string) => {
    const target = recoveryTasks.find((t) => t.id === taskId);
    if (!target || target.status === 'completed') return;

    const nextTaskStatus =
      target.status === 'pending' ? 'in_progress' : 'completed';

    setRecoveryTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextTaskStatus } : t))
    );

    const warnings: string[] = [];
    const statusErr = await updateRecoveryTaskStatusInDb(taskId, nextTaskStatus);
    if (statusErr) warnings.push(statusErr);

    if (nextTaskStatus === 'completed') {
      const baselineRes = INITIAL_RESOURCES.find(
        (r) => r.id === target.resourceId
      );
      const nextResources = resources.map((r) =>
        r.id === target.resourceId
          ? {
              ...r,
              status: 'operational' as StatusLevel,
              loadPercent: baselineRes
                ? Math.min(baselineRes.loadPercent, 74)
                : 65,
            }
          : r
      );

      const changedResources = nextResources.filter((r, i) => {
        const prev = resources[i];
        return prev.status !== r.status || prev.loadPercent !== r.loadPercent;
      });

      const nextBuildings = recomputeBuildingsFromResources(
        buildings,
        nextResources
      );
      const changedBuildings = nextBuildings.filter((b, i) => {
        const prev = buildings[i];
        return prev.status !== b.status || prev.notes !== b.notes;
      });

      const matchingAlertIds = alerts
        .filter(
          (a) =>
            !a.acknowledged && a.affectedResources.includes(target.resourceId)
        )
        .map((a) => a.id);

      setResources(nextResources);
      setBuildings(nextBuildings);
      if (matchingAlertIds.length > 0) {
        const idSet = new Set(matchingAlertIds);
        setAlerts((prev) =>
          prev.map((a) => (idSet.has(a.id) ? { ...a, acknowledged: true } : a))
        );
      }

      const nextScore = calculateHealthScore(nextResources);
      const nowLabel = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const newPoint: TelemetryPoint = {
        time: nowLabel,
        healthScore: nextScore,
        powerLoad:
          nextResources.find((r) => r.id === 'electricity')?.loadPercent ?? 70,
        networkLoad:
          nextResources.find((r) => r.id === 'internet')?.loadPercent ?? 60,
      };

      setTelemetry((prev) => [...prev.slice(-7), newPoint]);

      const [resErr, bldgErr, alertErr, telRes] = await Promise.all([
        updateChangedResources(changedResources),
        updateChangedBuildings(changedBuildings),
        acknowledgeResourceAlertsInDb(target.resourceId, matchingAlertIds),
        insertTelemetryPointInDb(newPoint),
      ]);

      if (resErr) warnings.push(resErr);
      if (bldgErr) warnings.push(bldgErr);
      if (alertErr) warnings.push(alertErr);
      if (telRes.error) warnings.push(telRes.error);
    }

    if (warnings.length > 0) {
      setDbWarning(warnings[0]);
    }
  };

  const toggleAcknowledgeAlert = async (alertId: string) => {
    const existing = alerts.find((a) => a.id === alertId);
    if (!existing) return;
    const nextAck = !existing.acknowledged;

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, acknowledged: nextAck } : a
      )
    );

    const err = await updateAlertAckInDb(alertId, nextAck);
    if (err) {
      // Revert optimistic update if Supabase rejects
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, acknowledged: existing.acknowledged } : a
        )
      );
      setDbWarning(err);
    }
  };

  const dismissAlert = async (alertId: string) => {
    const existing = alerts.find((a) => a.id === alertId);
    if (!existing) return;

    setAlerts((prev) => prev.filter((a) => a.id !== alertId));

    const err = await deleteAlertFromDb(alertId);
    if (err) {
      setAlerts((prev) => [existing, ...prev]);
      setDbWarning(err);
    }
  };

  const resetDigitalTwin = async () => {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setIsSyncing(true);
    setDbWarning(null);

    setResources(INITIAL_RESOURCES);
    setBuildings(INITIAL_BUILDINGS);
    setAlerts(INITIAL_ALERTS);
    setRecoveryTasks(INITIAL_RECOVERY_TASKS);
    setTelemetry(TELEMETRY_HISTORY);
    setLastSimulation(null);

    try {
      const res = await resetTwinBaselineInDb(
        INITIAL_RESOURCES,
        INITIAL_BUILDINGS,
        INITIAL_ALERTS,
        INITIAL_RECOVERY_TASKS
      );
      if (res.alerts) setAlerts(res.alerts);
      if (res.recoveryTasks) setRecoveryTasks(res.recoveryTasks);
      if (res.warnings.length > 0) {
        setDbWarning(res.warnings[0]);
      }
    } catch (err) {
      setDbWarning(
        err instanceof Error ? err.message : 'Failed to reset twin in Supabase.'
      );
    } finally {
      syncLockRef.current = false;
      setIsSyncing(false);
    }
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
        resourceLoading,
        resourceError,
        isSyncing,
        dbWarning,
        clearDbWarning: () => setDbWarning(null),
        edges,
        buildings,
        alerts,
        recoveryTasks,
        simulationPresets,
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
