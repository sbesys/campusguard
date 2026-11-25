import { supabase } from '../lib/supabase';
import {
  AlertItem,
  AlertSeverity,
  Building,
  RecoveryPriority,
  RecoveryStatus,
  RecoveryTask,
  ResourceEdge,
  ResourceId,
  ResourceNode,
  SimulationPreset,
  SimulationResult,
  StatusLevel,
  TelemetryPoint,
} from '../types/campus';

// Database row types matching the exact inspected Supabase schema
export interface ResourceRow {
  id: string;
  name: string;
  status: string | null;
  load_percent: number | null;
  location: string | null;
  description: string | null;
  short_name: string | null;
  category: string | null;
  capacity_label: string | null;
  backup_buffer_minutes: number | null;
  criticality_weight: number | null;
  owner_unit: string | null;
  x: number | null;
  y: number | null;
  metrics: { label: string; value: string }[] | null;
}

interface BuildingRow {
  id: string;
  code: string;
  name: string;
  zone: string;
  status: string | null;
  occupancy: number | null;
  max_occupancy: number | null;
  departments: string[] | null;
  dependent_resources: string[] | null;
  criticality: string | null;
  map_x: number | null;
  map_y: number | null;
  map_w: number | null;
  map_h: number | null;
  power_load_kw: number | null;
  notes: string | null;
}

interface ResourceEdgeRow {
  id: string;
  from_resource: string;
  to_resource: string;
  dependency_type: string;
  impact_weight: number | null;
  buffer_minutes: number | null;
  description: string | null;
}

interface AlertRow {
  id: string;
  title: string;
  severity: string;
  timestamp: string | null;
  category: string | null;
  affected_resources: string[] | null;
  affected_buildings: string[] | null;
  description: string | null;
  acknowledged: boolean | null;
  source: string | null;
  created_at?: string | null;
}

interface RecoveryTaskRow {
  id: string;
  resource_id: string;
  resource_name: string | null;
  title: string;
  priority: string;
  status: string;
  estimated_minutes: number | null;
  assigned_team: string | null;
  affected_buildings: string[] | null;
  suggestions: string[] | null;
  health_gain_estimate: number | null;
}

interface SimulationPresetRow {
  id: string;
  name: string;
  resource_id: string;
  severity: string;
  duration_minutes: number;
  description: string | null;
}

interface TelemetryPointRow {
  id: number;
  recorded_time: string;
  health_score: number;
  power_load: number;
  network_load: number;
}

export function mapResourceRow(row: ResourceRow): ResourceNode {
  return {
    id: row.id as ResourceId,
    name: row.name,
    shortName: row.short_name ?? row.name,
    category: (row.category ?? 'Core Utility') as ResourceNode['category'],
    status: (row.status ?? 'operational') as StatusLevel,
    loadPercent: Number(row.load_percent ?? 0),
    capacityLabel: row.capacity_label ?? '',
    backupBufferMinutes: Number(row.backup_buffer_minutes ?? 0),
    criticalityWeight: Number(row.criticality_weight ?? 0),
    ownerUnit: row.owner_unit ?? '',
    location: row.location ?? '',
    description: row.description ?? '',
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    metrics: Array.isArray(row.metrics) ? row.metrics : [],
  };
}

function mapBuildingRow(row: BuildingRow): Building {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    zone: row.zone as Building['zone'],
    status: (row.status ?? 'operational') as StatusLevel,
    occupancy: Number(row.occupancy ?? 0),
    maxOccupancy: Number(row.max_occupancy ?? 0),
    departments: Array.isArray(row.departments) ? row.departments : [],
    dependentResources: (Array.isArray(row.dependent_resources)
      ? row.dependent_resources
      : []) as ResourceId[],
    criticality: (row.criticality ?? 'Standard') as Building['criticality'],
    mapX: Number(row.map_x ?? 0),
    mapY: Number(row.map_y ?? 0),
    mapW: Number(row.map_w ?? 140),
    mapH: Number(row.map_h ?? 90),
    powerLoadKw: Number(row.power_load_kw ?? 0),
    notes: row.notes ?? '',
  };
}

function mapEdgeRow(row: ResourceEdgeRow): ResourceEdge {
  return {
    id: row.id,
    from: row.from_resource as ResourceId,
    to: row.to_resource as ResourceId,
    dependencyType: row.dependency_type as ResourceEdge['dependencyType'],
    impactWeight: Number(row.impact_weight ?? 0.5),
    bufferMinutes: Number(row.buffer_minutes ?? 0),
    description: row.description ?? '',
  };
}

function mapAlertRow(row: AlertRow): AlertItem {
  return {
    id: row.id,
    title: row.title,
    severity: (row.severity ?? 'info') as AlertSeverity,
    timestamp: row.timestamp ?? 'Recently',
    category: row.category ?? 'Operational',
    affectedResources: (Array.isArray(row.affected_resources)
      ? row.affected_resources
      : []) as ResourceId[],
    affectedBuildings: Array.isArray(row.affected_buildings)
      ? row.affected_buildings
      : [],
    description: row.description ?? '',
    acknowledged: Boolean(row.acknowledged),
    source: (row.source ?? 'Live Telemetry') as AlertItem['source'],
  };
}

function mapRecoveryTaskRow(row: RecoveryTaskRow): RecoveryTask {
  return {
    id: row.id,
    resourceId: row.resource_id as ResourceId,
    resourceName: row.resource_name ?? row.resource_id,
    title: row.title,
    priority: row.priority as RecoveryPriority,
    status: row.status as RecoveryStatus,
    estimatedMinutes: Number(row.estimated_minutes ?? 15),
    assignedTeam: row.assigned_team ?? 'Campus Ops Team',
    affectedBuildings: Array.isArray(row.affected_buildings)
      ? row.affected_buildings
      : [],
    suggestions: Array.isArray(row.suggestions) ? row.suggestions : [],
    healthGainEstimate: Number(row.health_gain_estimate ?? 5),
  };
}

function mapPresetRow(row: SimulationPresetRow): SimulationPreset {
  return {
    id: row.id,
    name: row.name,
    resourceId: row.resource_id as ResourceId,
    severity: row.severity as Exclude<StatusLevel, 'operational'>,
    durationMinutes: Number(row.duration_minutes),
    description: row.description ?? '',
  };
}

function mapTelemetryRow(row: TelemetryPointRow): TelemetryPoint {
  return {
    id: row.id,
    time: row.recorded_time,
    healthScore: Number(row.health_score),
    powerLoad: Number(row.power_load),
    networkLoad: Number(row.network_load),
  };
}

export interface HydratedCampusData {
  resources: ResourceNode[] | null;
  resourceError: string | null;
  buildings: Building[] | null;
  edges: ResourceEdge[] | null;
  alerts: AlertItem[] | null;
  recoveryTasks: RecoveryTask[] | null;
  presets: SimulationPreset[] | null;
  telemetry: TelemetryPoint[] | null;
  warnings: string[];
}

export async function fetchAllCampusData(): Promise<HydratedCampusData> {
  const warnings: string[] = [];

  const [
    resourcesRes,
    buildingsRes,
    edgesRes,
    alertsRes,
    tasksRes,
    presetsRes,
    telemetryRes,
  ] = await Promise.all([
    supabase.from('resources').select('*').order('id'),
    supabase.from('buildings').select('*').order('code'),
    supabase.from('resource_edges').select('*').order('id'),
    supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('recovery_tasks').select('*').order('priority'),
    supabase.from('simulation_presets').select('*').order('id'),
    supabase.from('telemetry_points').select('*').order('id', { ascending: true }),
  ]);

  let resources: ResourceNode[] | null = null;
  let resourceError: string | null = null;

  if (resourcesRes.error) {
    resourceError = resourcesRes.error.message;
  } else if (!resourcesRes.data || resourcesRes.data.length === 0) {
    resourceError = 'No resources found in Supabase.';
  } else {
    resources = (resourcesRes.data as ResourceRow[]).map(mapResourceRow);
    console.log(
      `CampusGuard: Loaded ${resourcesRes.data.length} resources from Supabase`
    );
  }

  let buildings: Building[] | null = null;
  if (buildingsRes.error) {
    warnings.push(`Buildings sync warning: ${buildingsRes.error.message}`);
  } else if (buildingsRes.data && buildingsRes.data.length > 0) {
    buildings = (buildingsRes.data as BuildingRow[]).map(mapBuildingRow);
  }

  let edges: ResourceEdge[] | null = null;
  if (edgesRes.error) {
    warnings.push(`Resource edges sync warning: ${edgesRes.error.message}`);
  } else if (edgesRes.data && edgesRes.data.length > 0) {
    edges = (edgesRes.data as ResourceEdgeRow[]).map(mapEdgeRow);
  }

  let alerts: AlertItem[] | null = null;
  if (alertsRes.error) {
    warnings.push(`Alerts sync warning: ${alertsRes.error.message}`);
  } else if (alertsRes.data) {
    alerts = (alertsRes.data as AlertRow[]).map(mapAlertRow);
  }

  let recoveryTasks: RecoveryTask[] | null = null;
  if (tasksRes.error) {
    warnings.push(`Recovery tasks sync warning: ${tasksRes.error.message}`);
  } else if (tasksRes.data) {
    recoveryTasks = (tasksRes.data as RecoveryTaskRow[]).map(mapRecoveryTaskRow);
  }

  let presets: SimulationPreset[] | null = null;
  if (presetsRes.error) {
    warnings.push(`Presets sync warning: ${presetsRes.error.message}`);
  } else if (presetsRes.data && presetsRes.data.length > 0) {
    presets = (presetsRes.data as SimulationPresetRow[]).map(mapPresetRow);
  }

  let telemetry: TelemetryPoint[] | null = null;
  if (telemetryRes.error) {
    warnings.push(`Telemetry sync warning: ${telemetryRes.error.message}`);
  } else if (telemetryRes.data && telemetryRes.data.length > 0) {
    telemetry = (telemetryRes.data as TelemetryPointRow[]).map(mapTelemetryRow);
  }

  return {
    resources,
    resourceError,
    buildings,
    edges,
    alerts,
    recoveryTasks,
    presets,
    telemetry,
    warnings,
  };
}

export async function updateChangedResources(
  changed: ResourceNode[]
): Promise<string | null> {
  if (changed.length === 0) return null;
  const results = await Promise.all(
    changed.map((r) =>
      supabase
        .from('resources')
        .update({ status: r.status, load_percent: r.loadPercent })
        .eq('id', r.id)
    )
  );
  const firstErr = results.find((r) => r.error)?.error;
  return firstErr ? `Resources update error: ${firstErr.message}` : null;
}

export async function updateChangedBuildings(
  changed: Building[]
): Promise<string | null> {
  if (changed.length === 0) return null;
  const results = await Promise.all(
    changed.map((b) =>
      supabase
        .from('buildings')
        .update({ status: b.status, notes: b.notes })
        .eq('id', b.id)
    )
  );
  const firstErr = results.find((r) => r.error)?.error;
  return firstErr ? `Buildings update error: ${firstErr.message}` : null;
}

export async function insertSimulationRecord(
  result: SimulationResult
): Promise<string | null> {
  const payload = {
    trigger_resource_id: result.triggerResourceId,
    trigger_severity: result.triggerSeverity,
    duration_minutes: result.durationMinutes,
    projected_health_score: result.projectedHealthScore,
    health_drop: result.healthDrop,
    summary: result.summary,
    affected_resources: result.affectedResourceIds,
    affected_buildings: result.affectedBuildings.map((b) => b.name),
    waves: result.waves,
    affected_departments: result.affectedDepartments,
  };

  const { error } = await supabase.from('simulations').insert(payload);
  if (error) {
    return `Simulations table warning: ${error.message}`;
  }
  return null;
}

export async function insertAlertsToDb(
  newAlerts: Omit<AlertItem, 'id'>[]
): Promise<{ rows: AlertItem[]; error: string | null }> {
  if (newAlerts.length === 0) return { rows: [], error: null };

  const payload = newAlerts.map((a) => ({
    title: a.title,
    severity: a.severity,
    timestamp: a.timestamp,
    category: a.category,
    affected_resources: a.affectedResources,
    affected_buildings: a.affectedBuildings,
    description: a.description,
    acknowledged: a.acknowledged,
    source: a.source,
  }));

  const { data, error } = await supabase.from('alerts').insert(payload).select('*');
  if (error) {
    return { rows: [], error: `Alerts insert error: ${error.message}` };
  }
  return {
    rows: ((data ?? []) as AlertRow[]).map(mapAlertRow),
    error: null,
  };
}

export async function updateAlertAckInDb(
  alertId: string,
  acknowledged: boolean
): Promise<string | null> {
  const { error } = await supabase
    .from('alerts')
    .update({ acknowledged })
    .eq('id', alertId);
  return error ? `Alert update error: ${error.message}` : null;
}

export async function acknowledgeResourceAlertsInDb(
  resourceId: ResourceId,
  alertIds: string[]
): Promise<string | null> {
  if (alertIds.length === 0) return null;
  const { error } = await supabase
    .from('alerts')
    .update({ acknowledged: true })
    .in('id', alertIds);
  return error
    ? `Failed to acknowledge alerts for ${resourceId}: ${error.message}`
    : null;
}

export async function deleteAlertFromDb(alertId: string): Promise<string | null> {
  const { error } = await supabase.from('alerts').delete().eq('id', alertId);
  return error ? `Alert delete error: ${error.message}` : null;
}

/**
 * Updates existing tasks for matching resource_ids in-place and inserts new tasks
 * for resources without an existing task, avoiding duplicate rows in recovery_tasks.
 */
export async function syncRecoveryTasksFromSimulation(
  generatedTasks: RecoveryTask[],
  existingTasks: RecoveryTask[]
): Promise<{ tasks: RecoveryTask[]; error: string | null }> {
  const existingByResource = new Map<ResourceId, RecoveryTask>();
  for (const t of existingTasks) {
    if (!existingByResource.has(t.resourceId)) {
      existingByResource.set(t.resourceId, t);
    }
  }

  const toUpdate: { id: string; task: RecoveryTask }[] = [];
  const toInsert: RecoveryTask[] = [];

  for (const task of generatedTasks) {
    const existing = existingByResource.get(task.resourceId);
    if (existing) {
      toUpdate.push({ id: existing.id, task });
    } else {
      toInsert.push(task);
    }
  }

  const errors: string[] = [];
  const persistedUpdated: RecoveryTask[] = [];

  for (const item of toUpdate) {
    const { data, error } = await supabase
      .from('recovery_tasks')
      .update({
        resource_name: item.task.resourceName,
        title: item.task.title,
        priority: item.task.priority,
        status: item.task.status,
        estimated_minutes: item.task.estimatedMinutes,
        assigned_team: item.task.assignedTeam,
        affected_buildings: item.task.affectedBuildings,
        suggestions: item.task.suggestions,
        health_gain_estimate: item.task.healthGainEstimate,
      })
      .eq('id', item.id)
      .select('*')
      .single();

    if (error) {
      errors.push(error.message);
    } else if (data) {
      persistedUpdated.push(mapRecoveryTaskRow(data as RecoveryTaskRow));
    }
  }

  let persistedInserted: RecoveryTask[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from('recovery_tasks')
      .insert(
        toInsert.map((t) => ({
          resource_id: t.resourceId,
          resource_name: t.resourceName,
          title: t.title,
          priority: t.priority,
          status: t.status,
          estimated_minutes: t.estimatedMinutes,
          assigned_team: t.assignedTeam,
          affected_buildings: t.affectedBuildings,
          suggestions: t.suggestions,
          health_gain_estimate: t.healthGainEstimate,
        }))
      )
      .select('*');

    if (error) {
      errors.push(error.message);
    } else if (data) {
      persistedInserted = (data as RecoveryTaskRow[]).map(mapRecoveryTaskRow);
    }
  }

  const replacedIds = new Set(toUpdate.map((u) => u.id));
  const untouched = existingTasks.filter((t) => !replacedIds.has(t.id));

  return {
    tasks: [...persistedInserted, ...persistedUpdated, ...untouched],
    error: errors.length > 0 ? `Recovery task sync error: ${errors[0]}` : null,
  };
}

export async function updateRecoveryTaskStatusInDb(
  taskId: string,
  status: RecoveryStatus
): Promise<string | null> {
  const { error } = await supabase
    .from('recovery_tasks')
    .update({ status })
    .eq('id', taskId);
  return error ? `Recovery status update error: ${error.message}` : null;
}

export async function insertTelemetryPointInDb(
  point: Omit<TelemetryPoint, 'id'>
): Promise<{ point: TelemetryPoint | null; error: string | null }> {
  const { data, error } = await supabase
    .from('telemetry_points')
    .insert({
      recorded_time: point.time,
      health_score: point.healthScore,
      power_load: point.powerLoad,
      network_load: point.networkLoad,
    })
    .select('*')
    .single();

  if (error) {
    return { point: null, error: `Telemetry insert error: ${error.message}` };
  }
  return {
    point: mapTelemetryRow(data as TelemetryPointRow),
    error: null,
  };
}

export async function resetTwinBaselineInDb(
  baselineResources: ResourceNode[],
  baselineBuildings: Building[],
  baselineAlerts: AlertItem[],
  baselineTasks: RecoveryTask[]
): Promise<{
  alerts: AlertItem[] | null;
  recoveryTasks: RecoveryTask[] | null;
  warnings: string[];
}> {
  const warnings: string[] = [];

  const resUpsert = await supabase.from('resources').upsert(
    baselineResources.map((r) => ({
      id: r.id,
      name: r.name,
      short_name: r.shortName,
      category: r.category,
      status: r.status,
      load_percent: r.loadPercent,
      capacity_label: r.capacityLabel,
      backup_buffer_minutes: r.backupBufferMinutes,
      criticality_weight: r.criticalityWeight,
      owner_unit: r.ownerUnit,
      location: r.location,
      description: r.description,
      x: r.x,
      y: r.y,
      metrics: r.metrics,
    }))
  );
  if (resUpsert.error) warnings.push(resUpsert.error.message);

  const bldgUpsert = await supabase.from('buildings').upsert(
    baselineBuildings.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      zone: b.zone,
      status: b.status,
      occupancy: b.occupancy,
      max_occupancy: b.maxOccupancy,
      departments: b.departments,
      dependent_resources: b.dependentResources,
      criticality: b.criticality,
      map_x: b.mapX,
      map_y: b.mapY,
      map_w: b.mapW,
      map_h: b.mapH,
      power_load_kw: b.powerLoadKw,
      notes: b.notes,
    }))
  );
  if (bldgUpsert.error) warnings.push(bldgUpsert.error.message);

  // Clean up simulation-generated alerts without duplicating baseline alerts
  const delSimAlerts = await supabase
    .from('alerts')
    .delete()
    .eq('source', 'Simulation Engine');
  if (delSimAlerts.error) warnings.push(delSimAlerts.error.message);

  const { data: remainingAlerts, error: fetchAlertsErr } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  let syncedAlerts: AlertItem[] | null = null;
  if (fetchAlertsErr) {
    warnings.push(fetchAlertsErr.message);
  } else {
    const existingTitles = new Set(
      (remainingAlerts as AlertRow[]).map((a) => a.title)
    );
    const missingBaseline = baselineAlerts.filter(
      (a) => !existingTitles.has(a.title)
    );
    if (missingBaseline.length > 0) {
      const inserted = await insertAlertsToDb(missingBaseline);
      if (inserted.error) warnings.push(inserted.error);
      syncedAlerts = [
        ...inserted.rows,
        ...(remainingAlerts as AlertRow[]).map(mapAlertRow),
      ];
    } else {
      syncedAlerts = (remainingAlerts as AlertRow[]).map(mapAlertRow);
    }
  }

  // Restore baseline recovery task cleanly without duplicates
  const baselineTitles = baselineTasks.map((t) => t.title);
  const { data: existingTasksData, error: fetchTasksErr } = await supabase
    .from('recovery_tasks')
    .select('*');

  let syncedTasks: RecoveryTask[] | null = null;
  if (fetchTasksErr) {
    warnings.push(fetchTasksErr.message);
  } else {
    const existingRows = (existingTasksData ?? []) as RecoveryTaskRow[];
    const nonBaselineIds = existingRows
      .filter((t) => !baselineTitles.includes(t.title))
      .map((t) => t.id);

    if (nonBaselineIds.length > 0) {
      const delTasks = await supabase
        .from('recovery_tasks')
        .delete()
        .in('id', nonBaselineIds);
      if (delTasks.error) warnings.push(delTasks.error.message);
    }

    const keptBaseline = existingRows.filter((t) =>
      baselineTitles.includes(t.title)
    );

    if (keptBaseline.length > 0) {
      const first = keptBaseline[0];
      const { data: updatedFirst, error: updErr } = await supabase
        .from('recovery_tasks')
        .update({ status: baselineTasks[0]?.status ?? 'in_progress' })
        .eq('id', first.id)
        .select('*')
        .single();
      if (updErr) {
        warnings.push(updErr.message);
        syncedTasks = keptBaseline.map(mapRecoveryTaskRow);
      } else {
        syncedTasks = [mapRecoveryTaskRow(updatedFirst as RecoveryTaskRow)];
      }
    } else if (baselineTasks.length > 0) {
      const { data: insTask, error: insErr } = await supabase
        .from('recovery_tasks')
        .insert(
          baselineTasks.map((t) => ({
            resource_id: t.resourceId,
            resource_name: t.resourceName,
            title: t.title,
            priority: t.priority,
            status: t.status,
            estimated_minutes: t.estimatedMinutes,
            assigned_team: t.assignedTeam,
            affected_buildings: t.affectedBuildings,
            suggestions: t.suggestions,
            health_gain_estimate: t.healthGainEstimate,
          }))
        )
        .select('*');
      if (insErr) {
        warnings.push(insErr.message);
      } else {
        syncedTasks = ((insTask ?? []) as RecoveryTaskRow[]).map(
          mapRecoveryTaskRow
        );
      }
    } else {
      syncedTasks = [];
    }
  }

  return {
    alerts: syncedAlerts,
    recoveryTasks: syncedTasks,
    warnings,
  };
}
