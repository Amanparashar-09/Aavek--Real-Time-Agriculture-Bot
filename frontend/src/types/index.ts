// Robot Operating Modes
export type RobotMode = 'idle' | 'scanning' | 'spraying' | 'alert' | 'returning';

// Severity Levels
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// Alert Types
export type AlertType = 'disease_detected' | 'pest_detected' | 'low_battery' | 'low_pesticide' | 'hardware_fault' | 'boundary_breach';

// Mission Types
export type MissionType = 'targeted_spray' | 'zone_scan' | 'return_base' | 'perimeter_check';

// Mission Status
export type MissionStatus = 'queued' | 'active' | 'completed' | 'failed' | 'cancelled';

// Device Health Status
export type DeviceHealth = 'healthy' | 'degraded' | 'fault';

// Telemetry Update from robot
export interface TelemetryUpdate {
  timestamp: number;
  battery: number; // 0-100
  pesticide: number; // 0-100
  cpu: number; // 0-100
  fps: number;
  latency: number; // ms
  temperature?: number; // Celsius
  humidity?: number; // %
  position: {
    lat: number;
    lng: number;
  };
  heading: number; // 0-360 degrees
  speed: number; // m/s
}

// Vision Detection Box
export interface DetectionBox {
  id: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  width: number; // 0-1 normalized
  height: number; // 0-1 normalized
  label: string;
  confidence: number; // 0-1
  color: string;
}

// Vision Detections from camera feed
export interface VisionDetections {
  frameId: number;
  timestamp: number;
  boxes: DetectionBox[];
  masks?: string; // base64 encoded mask overlay
  snapshotUrl?: string;
}

// Zone Statistics
export interface ZoneStat {
  zoneId: string;
  zoneName: string;
  infectionLevel: number; // 0-100
  leafCount: number;
  lastScanned: number;
}

// Plant Health Summary
export interface HealthSummary {
  timestamp: number;
  plantHealthScore: number; // 0-100
  infectionPercent: number; // 0-100
  severityLevel: SeverityLevel;
  leafCount: number;
  zoneStats: ZoneStat[];
}

// Alert Event
export interface AlertEvent {
  id: string;
  type: AlertType;
  severity: SeverityLevel;
  confidence: number; // 0-1
  timestamp: number;
  location: {
    lat: number;
    lng: number;
  };
  snapshotRef?: string;
  suggestedAction: string;
  acknowledged: boolean;
}

// Mission Log Entry
export interface MissionLog {
  timestamp: number;
  message: string;
  type: 'info' | 'action' | 'confirm' | 'warning' | 'error';
}

// Mission State
export interface MissionState {
  missionId: string;
  type: MissionType;
  status: MissionStatus;
  targetCount: number;
  progress: number; // 0-100
  resourceEstimate: {
    batteryRequired: number;
    pesticideRequired: number;
    estimatedDuration: number; // seconds
  };
  logs: MissionLog[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// Model Info
export interface ModelInfo {
  name: string;
  version: string;
  hash: string;
  inputShape: string;
  runtime: string;
  lastLoaded: number;
  inferenceTimeMs: number;
}

// System Info
export interface SystemInfo {
  botId: string;
  botName: string;
  firmwareVersion: string;
  models: ModelInfo[];
  deviceHealth: {
    camera: DeviceHealth;
    motors: DeviceHealth;
    sprayer: DeviceHealth;
    gps: DeviceHealth;
  };
  uptime: number; // seconds
}

// Complete Robot State
export interface RobotState {
  mode: RobotMode;
  telemetry: TelemetryUpdate;
  vision: VisionDetections;
  health: HealthSummary;
  alerts: AlertEvent[];
  missions: MissionState[];
  system: SystemInfo;
  isOnline: boolean;
  lastUpdate: number;
}

// WebSocket Message Types
export type WSMessageType = 
  | 'telemetry'
  | 'vision'
  | 'health'
  | 'alert'
  | 'mission'
  | 'system'
  | 'mode_change';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

// Historical Data Point
export interface HistoricalDataPoint {
  timestamp: number;
  value: number;
}

// Detection History Entry
export interface DetectionHistoryEntry {
  id: string;
  timestamp: number;
  type: string;
  confidence: number;
  location: { lat: number; lng: number };
  actionTaken?: string;
}

// Spray Usage Entry
export interface SprayUsageEntry {
  timestamp: number;
  amount: number; // ml
  missionId: string;
  targetCount: number;
}
