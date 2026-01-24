import { create } from 'zustand';
import { 
  RobotState, 
  RobotMode, 
  TelemetryUpdate, 
  VisionDetections, 
  HealthSummary, 
  AlertEvent, 
  MissionState,
  SystemInfo,
  HistoricalDataPoint,
  DetectionHistoryEntry,
  SprayUsageEntry
} from '@/types';

interface RobotStore extends RobotState {
  // Historical data
  telemetryHistory: {
    battery: HistoricalDataPoint[];
    pesticide: HistoricalDataPoint[];
    cpu: HistoricalDataPoint[];
    latency: HistoricalDataPoint[];
  };
  healthHistory: {
    score: HistoricalDataPoint[];
    infection: HistoricalDataPoint[];
  };
  detectionHistory: DetectionHistoryEntry[];
  sprayUsage: SprayUsageEntry[];
  positionTrail: Array<{ lat: number; lng: number; timestamp: number }>;
  
  // Simulator state
  isSimulating: boolean;
  
  // Actions
  setMode: (mode: RobotMode) => void;
  updateTelemetry: (telemetry: TelemetryUpdate) => void;
  updateVision: (vision: VisionDetections) => void;
  updateHealth: (health: HealthSummary) => void;
  addAlert: (alert: AlertEvent) => void;
  acknowledgeAlert: (alertId: string) => void;
  updateMission: (mission: MissionState) => void;
  updateSystem: (system: SystemInfo) => void;
  setOnline: (isOnline: boolean) => void;
  setSimulating: (isSimulating: boolean) => void;
  addDetectionToHistory: (detection: DetectionHistoryEntry) => void;
  addSprayUsage: (usage: SprayUsageEntry) => void;
}

const initialTelemetry: TelemetryUpdate = {
  timestamp: Date.now(),
  battery: 85,
  pesticide: 72,
  cpu: 45,
  fps: 30,
  latency: 12,
  temperature: 28,
  humidity: 65,
  position: { lat: 37.7749, lng: -122.4194 },
  heading: 45,
  speed: 0.5,
};

const initialVision: VisionDetections = {
  frameId: 0,
  timestamp: Date.now(),
  boxes: [],
};

const initialHealth: HealthSummary = {
  timestamp: Date.now(),
  plantHealthScore: 78,
  infectionPercent: 12,
  severityLevel: 'low',
  leafCount: 1247,
  zoneStats: [
    { zoneId: 'z1', zoneName: 'North Field', infectionLevel: 8, leafCount: 412, lastScanned: Date.now() - 300000 },
    { zoneId: 'z2', zoneName: 'East Sector', infectionLevel: 15, leafCount: 398, lastScanned: Date.now() - 600000 },
    { zoneId: 'z3', zoneName: 'South Rows', infectionLevel: 22, leafCount: 437, lastScanned: Date.now() - 900000 },
  ],
};

const initialSystem: SystemInfo = {
  botId: 'AGR-BOT-001',
  botName: 'Aavek',
  firmwareVersion: '2.4.1',
  models: [
    {
      name: 'YOLOv8-AgriDetect',
      version: '1.2.0',
      hash: 'a3f2c1d4',
      inputShape: '640x640x3',
      runtime: 'TensorRT',
      lastLoaded: Date.now() - 3600000,
      inferenceTimeMs: 18,
    },
    {
      name: 'PlantNet-Health',
      version: '0.9.3',
      hash: 'b7e4f2a1',
      inputShape: '224x224x3',
      runtime: 'ONNX',
      lastLoaded: Date.now() - 3600000,
      inferenceTimeMs: 24,
    },
  ],
  deviceHealth: {
    camera: 'healthy',
    motors: 'healthy',
    sprayer: 'healthy',
    gps: 'healthy',
  },
  uptime: 14523,
};

export const useRobotStore = create<RobotStore>((set, get) => ({
  // Initial state
  mode: 'scanning',
  telemetry: initialTelemetry,
  vision: initialVision,
  health: initialHealth,
  alerts: [],
  missions: [],
  system: initialSystem,
  isOnline: true,
  lastUpdate: Date.now(),
  isSimulating: true,
  
  // Historical data
  telemetryHistory: {
    battery: [],
    pesticide: [],
    cpu: [],
    latency: [],
  },
  healthHistory: {
    score: [],
    infection: [],
  },
  detectionHistory: [],
  sprayUsage: [],
  positionTrail: [],
  
  // Actions
  setMode: (mode) => set({ mode, lastUpdate: Date.now() }),
  
  updateTelemetry: (telemetry) => {
    const state = get();
    const now = Date.now();
    
    // Keep last 60 data points (about 1 minute at 1s intervals)
    const maxHistory = 60;
    
    set({
      telemetry,
      lastUpdate: now,
      telemetryHistory: {
        battery: [...state.telemetryHistory.battery, { timestamp: now, value: telemetry.battery }].slice(-maxHistory),
        pesticide: [...state.telemetryHistory.pesticide, { timestamp: now, value: telemetry.pesticide }].slice(-maxHistory),
        cpu: [...state.telemetryHistory.cpu, { timestamp: now, value: telemetry.cpu }].slice(-maxHistory),
        latency: [...state.telemetryHistory.latency, { timestamp: now, value: telemetry.latency }].slice(-maxHistory),
      },
      positionTrail: [...state.positionTrail, { ...telemetry.position, timestamp: now }].slice(-100),
    });
  },
  
  updateVision: (vision) => set({ vision, lastUpdate: Date.now() }),
  
  updateHealth: (health) => {
    const state = get();
    const now = Date.now();
    const maxHistory = 60;
    
    set({
      health,
      lastUpdate: now,
      healthHistory: {
        score: [...state.healthHistory.score, { timestamp: now, value: health.plantHealthScore }].slice(-maxHistory),
        infection: [...state.healthHistory.infection, { timestamp: now, value: health.infectionPercent }].slice(-maxHistory),
      },
    });
  },
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 50), // Keep last 50 alerts
    lastUpdate: Date.now(),
  })),
  
  acknowledgeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ),
  })),
  
  updateMission: (mission) => set((state) => {
    const existingIndex = state.missions.findIndex(m => m.missionId === mission.missionId);
    const newMissions = existingIndex >= 0
      ? state.missions.map((m, i) => i === existingIndex ? mission : m)
      : [...state.missions, mission];
    
    return { missions: newMissions, lastUpdate: Date.now() };
  }),
  
  updateSystem: (system) => set({ system, lastUpdate: Date.now() }),
  
  setOnline: (isOnline) => set({ isOnline, lastUpdate: Date.now() }),
  
  setSimulating: (isSimulating) => set({ isSimulating }),
  
  addDetectionToHistory: (detection) => set((state) => ({
    detectionHistory: [detection, ...state.detectionHistory].slice(0, 200),
  })),
  
  addSprayUsage: (usage) => set((state) => ({
    sprayUsage: [usage, ...state.sprayUsage].slice(0, 100),
  })),
}));
