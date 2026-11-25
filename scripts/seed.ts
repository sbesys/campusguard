
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

import {
  INITIAL_RESOURCES,
  INITIAL_BUILDINGS,
  RESOURCE_EDGES,
  INITIAL_ALERTS,
  INITIAL_RECOVERY_TASKS,
  SIMULATION_PRESETS,
  TELEMETRY_HISTORY,
} from '../src/data/campusData';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing Supabase environment variables in .env');
}

const supabase = createClient(url, key);

async function seed() {
  const operations = [
    {
      table: 'resources',
      rows: INITIAL_RESOURCES.map(r => ({
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
      })),
    },
    {
      table: 'buildings',
      rows: INITIAL_BUILDINGS.map(b => ({
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
      })),
    },
    {
      table: 'alerts',
      rows: INITIAL_ALERTS.map(a => ({
        title: a.title,
        severity: a.severity,
        timestamp: a.timestamp,
        category: a.category,
        affected_resources: a.affectedResources,
        affected_buildings: a.affectedBuildings,
        description: a.description,
        acknowledged: a.acknowledged,
        source: a.source,
      })),
    },
    {
      table: 'recovery_tasks',
      rows: INITIAL_RECOVERY_TASKS.map(t => ({
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
      })),
    },
    {
      table: 'resource_edges',
      rows: RESOURCE_EDGES.map(e => ({
        id: e.id,
        from_resource: e.from,
        to_resource: e.to,
        dependency_type: e.dependencyType,
        impact_weight: e.impactWeight,
        buffer_minutes: e.bufferMinutes,
        description: e.description,
      })),
    },
    {
      table: 'simulation_presets',
      rows: SIMULATION_PRESETS.map(p => ({
        id: p.id,
        name: p.name,
        resource_id: p.resourceId,
        severity: p.severity,
        duration_minutes: p.durationMinutes,
        description: p.description,
      })),
    },
    {
      table: 'telemetry_points',
      rows: TELEMETRY_HISTORY.map(t => ({
        recorded_time: t.time,
        health_score: t.healthScore,
        power_load: t.powerLoad,
        network_load: t.networkLoad,
      })),
    },
  ];

  for (const operation of operations) {
    const { error } = await supabase
      .from(operation.table)
      .upsert(operation.rows);

    if (error) {
      console.error(`Failed importing ${operation.table}:`, error.message);
      throw error;
    }

    console.log(`Imported ${operation.rows.length} records into ${operation.table}`);
  }

  console.log('CampusGuard data import complete!');
}

seed().catch(error => {
  console.error(error);
  process.exitCode = 1;
});