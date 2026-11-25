export type StatusLevel = 'operational' | 'degraded' | 'critical';

export type PageId =
  | 'dashboard'
  | 'network'
  | 'simulation'
  | 'recovery'
  | 'map'
  | 'alerts';

export type ResourceId =
  | 'electricity'
  | 'water'
  | 'internet'
  | 'labs'
  | 'classrooms'
  | 'library'
  | 'hostel'
  | 'hospital'
  | 'transport';

export interface ResourceNode {
  id: ResourceId;
  name: string;
  shortName: string;
  category: 'Core Utility' | 'Academic' | 'Campus Life' | 'Safety & Mobility';
  status: StatusLevel;
  loadPercent: number;
  capacityLabel: string;
  backupBufferMinutes: number; // How long backup sustains before constraint breach
  criticalityWeight: number; // Contribution to overall health score
  ownerUnit: string;
  location: string;
  description: string;
  // Coordinates on the 900x520 SVG network diagram
  x: number;
  y: number;
  metrics: {
    label: string;
    value: string;
  }[];
}

export interface ResourceEdge {
  id: string;
  from: ResourceId;
  to: ResourceId;
  dependencyType: 'Hard Constraint' | 'Buffered' | 'Operational';
  impactWeight: number; // 0.3 to 1.0
  bufferMinutes: number;
  description: string;
}

export interface Building {
  id: string;
  code: string;
  name: string;
  zone: 'North Quad' | 'Central Core' | 'East Utility' | 'South Residential';
  status: StatusLevel;
  occupancy: number;
  maxOccupancy: number;
  departments: string[];
  dependentResources: ResourceId[];
  criticality: 'Mission Critical' | 'High' | 'Standard';
  // SVG map coordinates (800x480 canvas)
  mapX: number;
  mapY: number;
  mapW: number;
  mapH: number;
  powerLoadKw: number;
  notes: string;
}

export interface DepartmentImpact {
  department: string;
  headcount: number;
  status: StatusLevel;
  impactSummary: string;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertItem {
  id: string;
  title: string;
  severity: AlertSeverity;
  timestamp: string;
  category: string;
  affectedResources: ResourceId[];
  affectedBuildings: string[];
  description: string;
  acknowledged: boolean;
  source: 'Live Telemetry' | 'Simulation Engine' | 'Predictive AI';
}

export type RecoveryPriority = 'P0 - Immediate' | 'P1 - Urgent' | 'P2 - Scheduled';
export type RecoveryStatus = 'pending' | 'in_progress' | 'completed';

export interface RecoveryTask {
  id: string;
  resourceId: ResourceId;
  resourceName: string;
  title: string;
  priority: RecoveryPriority;
  status: RecoveryStatus;
  estimatedMinutes: number;
  assignedTeam: string;
  affectedBuildings: string[];
  suggestions: string[];
  healthGainEstimate: number;
}

export interface WaveImpact {
  wave: number;
  resourceId: ResourceId;
  resourceName: string;
  triggeredBy: ResourceId | null;
  resultingStatus: StatusLevel;
  reason: string;
  bufferExhausted: boolean;
  timeToImpactMinutes: number;
}

export interface SimulationResult {
  triggerResourceId: ResourceId;
  triggerSeverity: Exclude<StatusLevel, 'operational'>;
  durationMinutes: number;
  projectedHealthScore: number;
  healthDrop: number;
  waves: WaveImpact[];
  affectedResourceIds: ResourceId[];
  affectedBuildings: {
    buildingId: string;
    name: string;
    code: string;
    projectedStatus: StatusLevel;
    reason: string;
  }[];
  affectedDepartments: DepartmentImpact[];
  generatedTasks: Omit<RecoveryTask, 'id' | 'status'>[];
  summary: string;
}

export interface SimulationPreset {
  id: string;
  name: string;
  resourceId: ResourceId;
  severity: Exclude<StatusLevel, 'operational'>;
  durationMinutes: number;
  description: string;
}

export interface TelemetryPoint {
  id?: number;
  time: string;
  healthScore: number;
  powerLoad: number;
  networkLoad: number;
}

export interface SimulationRecord {
  id?: string;
  triggerResourceId: ResourceId;
  triggerSeverity: Exclude<StatusLevel, 'operational'>;
  durationMinutes: number;
  projectedHealthScore: number;
  healthDrop: number;
  summary: string;
  affectedResources: ResourceId[];
  affectedBuildings: string[];
  createdAt?: string;
}
