import {
  Building,
  DepartmentImpact,
  RecoveryPriority,
  RecoveryTask,
  ResourceEdge,
  ResourceId,
  ResourceNode,
  SimulationResult,
  StatusLevel,
  WaveImpact,
} from '../types/campus';

const STATUS_SEVERITY_RANK: Record<StatusLevel, number> = {
  operational: 0,
  degraded: 1,
  critical: 2,
};

function worseStatus(a: StatusLevel, b: StatusLevel): StatusLevel {
  return STATUS_SEVERITY_RANK[a] >= STATUS_SEVERITY_RANK[b] ? a : b;
}

/**
 * Calculates the overall institutional health score (0-100) from current resource statuses & loads.
 */
export function calculateHealthScore(resources: ResourceNode[]): number {
  const totalWeight = resources.reduce((sum, r) => sum + r.criticalityWeight, 0);
  if (totalWeight === 0) return 100;

  let penalty = 0;
  for (const res of resources) {
    if (res.status === 'critical') {
      penalty += res.criticalityWeight * 1.0;
    } else if (res.status === 'degraded') {
      penalty += res.criticalityWeight * 0.42;
    } else if (res.loadPercent > 85) {
      penalty += res.criticalityWeight * 0.1;
    }
  }

  return Math.max(0, Math.round(100 - (penalty / totalWeight) * 100));
}

const RECOVERY_PLAYBOOKS: Record<
  ResourceId,
  {
    team: string;
    minutes: number;
    suggestions: string[];
  }
> = {
  electricity: {
    team: 'High-Voltage Substation Team',
    minutes: 35,
    suggestions: [
      'Engage synchronized 1.2 MW Diesel Generator bank and shed non-essential HVAC.',
      'Isolate faulted 11kV feeder breaker and transfer load to redundant utility bus.',
      'Prioritize Nightingale Medical Center and NOC UPS feeds during restoration.',
    ],
  },
  water: {
    team: 'Utilities Mechanical Crew B',
    minutes: 30,
    suggestions: [
      'Activate standby VFD booster pump and switch to secondary gravity header.',
      'Deploy campus water tanker support to Hospital and Hostel dining kitchens.',
      'Throttle non-critical irrigation and cooling tower makeup lines.',
    ],
  },
  internet: {
    team: 'NOC & Core Infrastructure Team',
    minutes: 20,
    suggestions: [
      'Reroute BGP traffic over secondary ISP microwave/LTE failover trunk.',
      'Switch campus LMS and Library OPAC to local edge-cache appliances.',
      'Verify optical SFP link integrity in Turing Wing distribution rack.',
    ],
  },
  labs: {
    team: 'Research Facilities & Safety Ops',
    minutes: 25,
    suggestions: [
      'Trigger graceful checkpoint & pause on HPC GPU training jobs.',
      'Seal chemical fume hoods and verify negative pressure dampers.',
      'Rebalance cleanroom cooling onto auxiliary chiller loop.',
    ],
  },
  classrooms: {
    team: 'Academic Facilities Support',
    minutes: 20,
    suggestions: [
      'Shift active smart-board lectures to offline local slides & natural ventilation.',
      'Relocate critical lab-integrated classes to unaffected seminar wings.',
      'Notify Academic Registrar to broadcast room reassignments.',
    ],
  },
  library: {
    team: 'Library Systems & IT Desk',
    minutes: 15,
    suggestions: [
      'Enable offline RFID gate logging and manual checkout fallback.',
      'Switch reading hall emergency LED lighting to battery inverter bank.',
      'Mirror exam-prep study packs on local campus intranet cache.',
    ],
  },
  hostel: {
    team: 'Student Housing & Mess Ops',
    minutes: 40,
    suggestions: [
      'Lock hostel elevators at ground floor and enable corridor emergency lighting.',
      'Engage solar-thermal and LPG backup boilers for dining mess operations.',
      'Ration rooftop gravity water reserves and distribute bottled drinking water.',
    ],
  },
  hospital: {
    team: 'Biomedical & Life-Safety Team',
    minutes: 10,
    suggestions: [
      'Verify Nightingale Dedicated Generator auto-transfer switch & fuel autonomy.',
      'Confirm vaccine/blood cold-storage units remain within 2 °C – 8 °C.',
      'Place campus ambulance bay on standby for external hospital transfers.',
    ],
  },
  transport: {
    team: 'Campus Mobility & Dispatch',
    minutes: 25,
    suggestions: [
      'Switch shuttle dispatch to VHF two-way radio and fixed 15-min loop schedule.',
      'Prioritize charged EV shuttles (>60% SoC) for Hospital and Hostel routes.',
      'Pause depot fast-chargers to conserve substation headroom.',
    ],
  },
};

/**
 * Constraint-based cascading failure simulation engine.
 * Traverses dependency edges using BFS, checking whether outage duration breaches each edge's bufferMinutes.
 */
export function runCascadingSimulation(
  resources: ResourceNode[],
  edges: ResourceEdge[],
  buildings: Building[],
  triggerResourceId: ResourceId,
  triggerSeverity: Exclude<StatusLevel, 'operational'>,
  durationMinutes: number
): SimulationResult {
  const resourceMap = new Map<ResourceId, ResourceNode>(
    resources.map((r) => [r.id, { ...r }])
  );

  const triggerNode = resourceMap.get(triggerResourceId);
  if (!triggerNode) {
    throw new Error(`Unknown resource: ${triggerResourceId}`);
  }

  // Track projected status per resource
  const projectedStatus = new Map<ResourceId, StatusLevel>();
  resources.forEach((r) => projectedStatus.set(r.id, r.status));
  projectedStatus.set(triggerResourceId, triggerSeverity);

  const waves: WaveImpact[] = [
    {
      wave: 0,
      resourceId: triggerResourceId,
      resourceName: triggerNode.name,
      triggeredBy: null,
      resultingStatus: triggerSeverity,
      reason: `Primary ${triggerSeverity === 'critical' ? 'outage' : 'degradation'} initiated (${durationMinutes} min scenario).`,
      bufferExhausted: true,
      timeToImpactMinutes: 0,
    },
  ];

  const queue: { id: ResourceId; wave: number; elapsedDelay: number }[] = [
    { id: triggerResourceId, wave: 0, elapsedDelay: 0 },
  ];
  const visitedAtWave = new Map<ResourceId, StatusLevel>();
  visitedAtWave.set(triggerResourceId, triggerSeverity);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const sourceStatus = projectedStatus.get(current.id) ?? 'operational';
    if (sourceStatus === 'operational') continue;

    const outgoing = edges.filter((e) => e.from === current.id);

    for (const edge of outgoing) {
      const targetNode = resourceMap.get(edge.to);
      if (!targetNode) continue;

      const remainingDuration = Math.max(0, durationMinutes - current.elapsedDelay);
      const bufferExhausted = remainingDuration > edge.bufferMinutes;

      let propagatedStatus: StatusLevel = 'operational';

      if (sourceStatus === 'critical') {
        if (edge.dependencyType === 'Hard Constraint') {
          propagatedStatus = bufferExhausted || edge.impactWeight >= 0.85 ? 'critical' : 'degraded';
        } else if (edge.dependencyType === 'Buffered') {
          propagatedStatus = bufferExhausted
            ? edge.impactWeight >= 0.85
              ? 'critical'
              : 'degraded'
            : 'degraded';
        } else {
          // Operational dependency
          propagatedStatus = bufferExhausted ? 'degraded' : 'operational';
        }
      } else if (sourceStatus === 'degraded') {
        if (edge.dependencyType === 'Hard Constraint' && edge.impactWeight >= 0.8) {
          propagatedStatus = 'degraded';
        } else if (edge.dependencyType === 'Buffered' && bufferExhausted && edge.impactWeight >= 0.85) {
          propagatedStatus = 'degraded';
        }
      }

      if (propagatedStatus === 'operational') continue;

      const prevTargetStatus = projectedStatus.get(edge.to) ?? 'operational';
      const nextTargetStatus = worseStatus(prevTargetStatus, propagatedStatus);

      // Only record and propagate if status worsens
      const prevRecorded = visitedAtWave.get(edge.to);
      if (!prevRecorded || STATUS_SEVERITY_RANK[nextTargetStatus] > STATUS_SEVERITY_RANK[prevRecorded]) {
        projectedStatus.set(edge.to, nextTargetStatus);
        visitedAtWave.set(edge.to, nextTargetStatus);

        const timeToImpact = Math.min(
          durationMinutes,
          current.elapsedDelay + (bufferExhausted ? edge.bufferMinutes : Math.round(edge.bufferMinutes * 0.4))
        );

        waves.push({
          wave: current.wave + 1,
          resourceId: edge.to,
          resourceName: targetNode.name,
          triggeredBy: current.id,
          resultingStatus: nextTargetStatus,
          reason: bufferExhausted
            ? `${edge.description} (${edge.bufferMinutes}m buffer exhausted)`
            : `${edge.description} (operating on limited backup buffer)`,
          bufferExhausted,
          timeToImpactMinutes: timeToImpact,
        });

        queue.push({
          id: edge.to,
          wave: current.wave + 1,
          elapsedDelay: timeToImpact,
        });
      }
    }
  }

  // Build projected resources to calculate health score
  const projectedResources: ResourceNode[] = resources.map((r) => ({
    ...r,
    status: projectedStatus.get(r.id) ?? r.status,
  }));

  const baselineScore = calculateHealthScore(resources);
  const projectedHealthScore = calculateHealthScore(projectedResources);
  const healthDrop = Math.max(0, baselineScore - projectedHealthScore);

  const affectedResourceIds = Array.from(
    new Set(waves.map((w) => w.resourceId))
  );

  // Evaluate building impacts
  const affectedBuildings = buildings
    .map((b) => {
      let bStatus: StatusLevel = 'operational';
      const culprits: string[] = [];
      for (const rId of b.dependentResources) {
        const rStatus = projectedStatus.get(rId) ?? 'operational';
        if (rStatus !== 'operational') {
          bStatus = worseStatus(bStatus, rStatus);
          const rName = resourceMap.get(rId)?.shortName ?? rId;
          culprits.push(`${rName} (${rStatus})`);
        }
      }
      return {
        buildingId: b.id,
        name: b.name,
        code: b.code,
        projectedStatus: bStatus,
        reason:
          culprits.length > 0
            ? `Impacted by ${culprits.join(', ')}`
            : 'All building dependencies nominal',
      };
    })
    .filter((b) => b.projectedStatus !== 'operational');

  // Evaluate department impacts
  const deptMap = new Map<string, { status: StatusLevel; buildings: string[] }>();
  for (const b of buildings) {
    const projectedB = affectedBuildings.find((ab) => ab.buildingId === b.id);
    if (!projectedB) continue;
    for (const dept of b.departments) {
      const existing = deptMap.get(dept);
      if (!existing) {
        deptMap.set(dept, { status: projectedB.projectedStatus, buildings: [b.name] });
      } else {
        existing.status = worseStatus(existing.status, projectedB.projectedStatus);
        if (!existing.buildings.includes(b.name)) {
          existing.buildings.push(b.name);
        }
      }
    }
  }

  const DEPT_HEADCOUNTS: Record<string, number> = {
    'Computer Science & AI': 1120,
    'Mechanical & Robotics': 680,
    'Biotechnology & Chem': 540,
    'Core Sciences & Humanities': 1480,
    'Medical & Student Wellness': 75,
    'Campus Operations & Logistics': 110,
    'Student Affairs & Housing': 2280,
  };

  const affectedDepartments: DepartmentImpact[] = Array.from(deptMap.entries()).map(
    ([department, info]) => ({
      department,
      headcount: DEPT_HEADCOUNTS[department] ?? 300,
      status: info.status,
      impactSummary: `${info.status === 'critical' ? 'Operations halted' : 'Reduced capacity'} across ${info.buildings.join(', ')}.`,
    })
  );

  // Generate prioritized recovery tasks for impacted resources
  const generatedTasks: Omit<RecoveryTask, 'id' | 'status'>[] = waves
    .filter((w) => w.resultingStatus !== 'operational')
    .sort((a, b) => a.wave - b.wave)
    .map((w) => {
      const node = resourceMap.get(w.resourceId)!;
      const playbook = RECOVERY_PLAYBOOKS[w.resourceId];
      const priority: RecoveryPriority =
        w.wave === 0 || w.resultingStatus === 'critical'
          ? w.wave === 0
            ? 'P0 - Immediate'
            : 'P1 - Urgent'
          : 'P2 - Scheduled';

      const impactedBldgs = buildings
        .filter((b) => b.dependentResources.includes(w.resourceId))
        .map((b) => b.name);

      return {
        resourceId: w.resourceId,
        resourceName: node.name,
        title:
          w.wave === 0
            ? `Restore Primary ${node.shortName} Service`
            : `Stabilize Cascading Impact on ${node.shortName}`,
        priority,
        estimatedMinutes: playbook.minutes,
        assignedTeam: playbook.team,
        affectedBuildings: impactedBldgs,
        suggestions: playbook.suggestions,
        healthGainEstimate: Math.max(3, Math.round(node.criticalityWeight * 0.75)),
      };
    });

  const criticalCount = waves.filter((w) => w.resultingStatus === 'critical').length;
  const degradedCount = waves.filter((w) => w.resultingStatus === 'degraded').length;

  const summary = `Simulating a ${durationMinutes}-minute ${triggerSeverity} event on ${triggerNode.name} cascades across ${affectedResourceIds.length} campus resources (${criticalCount} critical, ${degradedCount} degraded), impacting ${affectedBuildings.length} buildings and dropping Campus Health by ${healthDrop} points to ${projectedHealthScore}%.`;

  return {
    triggerResourceId,
    triggerSeverity,
    durationMinutes,
    projectedHealthScore,
    healthDrop,
    waves,
    affectedResourceIds,
    affectedBuildings,
    affectedDepartments,
    generatedTasks,
    summary,
  };
}
