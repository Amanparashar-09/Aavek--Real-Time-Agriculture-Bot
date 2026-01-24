import { useRobotStore } from '@/store/useRobotStore';
import { 
  TelemetryUpdate, 
  VisionDetections, 
  HealthSummary, 
  AlertEvent,
  MissionState,
  DetectionBox,
  RobotMode,
  AlertType,
  SeverityLevel,
  MissionLog
} from '@/types';

// Utility functions for realistic value generation
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const drift = (current: number, target: number, speed: number) => current + (target - current) * speed;
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

// State for smooth value transitions
let telemetryState = {
  battery: 85,
  pesticide: 72,
  cpu: 45,
  fps: 30,
  latency: 12,
  position: { lat: 37.7749, lng: -122.4194 },
  heading: 45,
  speed: 0.5,
};

let healthState = {
  score: 78,
  infection: 12,
  leafCount: 1247,
};

let frameCounter = 0;
let missionProgress = 0;
let activeMissionId: string | null = null;

// Detection labels for agricultural context
const detectionLabels = [
  { label: 'Powdery Mildew', color: '#ef4444', severity: 'high' as SeverityLevel },
  { label: 'Aphid Colony', color: '#f97316', severity: 'medium' as SeverityLevel },
  { label: 'Leaf Spot', color: '#eab308', severity: 'low' as SeverityLevel },
  { label: 'Healthy Leaf', color: '#22c55e', severity: 'low' as SeverityLevel },
  { label: 'Caterpillar', color: '#f97316', severity: 'medium' as SeverityLevel },
  { label: 'Rust Fungus', color: '#ef4444', severity: 'high' as SeverityLevel },
];

// Generate telemetry update with smooth transitions
function generateTelemetry(): TelemetryUpdate {
  const mode = useRobotStore.getState().mode;
  
  // Battery drains slowly, faster when spraying
  const drainRate = mode === 'spraying' ? 0.05 : mode === 'scanning' ? 0.02 : 0.01;
  telemetryState.battery = clamp(telemetryState.battery - drainRate, 5, 100);
  
  // Pesticide only decreases when spraying
  if (mode === 'spraying') {
    telemetryState.pesticide = clamp(telemetryState.pesticide - 0.1, 0, 100);
  }
  
  // CPU fluctuates based on activity
  const targetCpu = mode === 'scanning' ? 65 : mode === 'spraying' ? 55 : 35;
  telemetryState.cpu = drift(telemetryState.cpu, targetCpu + randomInRange(-5, 5), 0.1);
  
  // FPS fluctuates slightly
  telemetryState.fps = clamp(drift(telemetryState.fps, 30 + randomInRange(-3, 3), 0.2), 24, 32);
  
  // Latency varies
  telemetryState.latency = clamp(drift(telemetryState.latency, 12 + randomInRange(-5, 8), 0.15), 5, 50);
  
  // Position moves slowly in a pattern
  if (mode === 'scanning' || mode === 'spraying') {
    telemetryState.heading = (telemetryState.heading + randomInRange(-5, 5) + 360) % 360;
    const moveSpeed = mode === 'spraying' ? 0.00001 : 0.00002;
    telemetryState.position.lat += Math.cos(telemetryState.heading * Math.PI / 180) * moveSpeed;
    telemetryState.position.lng += Math.sin(telemetryState.heading * Math.PI / 180) * moveSpeed;
    telemetryState.speed = mode === 'spraying' ? 0.3 : 0.5;
  } else {
    telemetryState.speed = 0;
  }
  
  return {
    timestamp: Date.now(),
    battery: Math.round(telemetryState.battery * 10) / 10,
    pesticide: Math.round(telemetryState.pesticide * 10) / 10,
    cpu: Math.round(telemetryState.cpu),
    fps: Math.round(telemetryState.fps),
    latency: Math.round(telemetryState.latency),
    temperature: 28 + randomInRange(-2, 2),
    humidity: 65 + randomInRange(-5, 5),
    position: { ...telemetryState.position },
    heading: Math.round(telemetryState.heading),
    speed: telemetryState.speed,
  };
}

// Generate vision detections
function generateVision(): VisionDetections {
  frameCounter++;
  const mode = useRobotStore.getState().mode;
  
  const boxes: DetectionBox[] = [];
  
  if (mode === 'scanning' || mode === 'spraying') {
    // Generate 0-4 detections per frame
    const numDetections = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numDetections; i++) {
      const detection = detectionLabels[Math.floor(Math.random() * detectionLabels.length)];
      boxes.push({
        id: `det-${frameCounter}-${i}`,
        x: randomInRange(0.1, 0.7),
        y: randomInRange(0.1, 0.7),
        width: randomInRange(0.1, 0.25),
        height: randomInRange(0.1, 0.25),
        label: detection.label,
        confidence: randomInRange(0.7, 0.98),
        color: detection.color,
      });
    }
  }
  
  return {
    frameId: frameCounter,
    timestamp: Date.now(),
    boxes,
  };
}

// Generate health summary
function generateHealth(): HealthSummary {
  // Health score fluctuates slowly
  healthState.score = clamp(drift(healthState.score, 75 + randomInRange(-10, 10), 0.05), 40, 95);
  healthState.infection = clamp(drift(healthState.infection, 15 + randomInRange(-5, 5), 0.05), 2, 40);
  healthState.leafCount = Math.round(drift(healthState.leafCount, 1250 + randomInRange(-50, 50), 0.1));
  
  const severityLevel: SeverityLevel = 
    healthState.infection > 30 ? 'critical' :
    healthState.infection > 20 ? 'high' :
    healthState.infection > 10 ? 'medium' : 'low';
  
  return {
    timestamp: Date.now(),
    plantHealthScore: Math.round(healthState.score),
    infectionPercent: Math.round(healthState.infection * 10) / 10,
    severityLevel,
    leafCount: healthState.leafCount,
    zoneStats: [
      { 
        zoneId: 'z1', 
        zoneName: 'North Field', 
        infectionLevel: clamp(healthState.infection * randomInRange(0.5, 0.8), 0, 100),
        leafCount: 412 + Math.round(randomInRange(-20, 20)),
        lastScanned: Date.now() - 300000 
      },
      { 
        zoneId: 'z2', 
        zoneName: 'East Sector', 
        infectionLevel: clamp(healthState.infection * randomInRange(0.9, 1.2), 0, 100),
        leafCount: 398 + Math.round(randomInRange(-20, 20)),
        lastScanned: Date.now() - 600000 
      },
      { 
        zoneId: 'z3', 
        zoneName: 'South Rows', 
        infectionLevel: clamp(healthState.infection * randomInRange(1.2, 1.8), 0, 100),
        leafCount: 437 + Math.round(randomInRange(-20, 20)),
        lastScanned: Date.now() - 900000 
      },
    ],
  };
}

// Generate random alerts occasionally
function maybeGenerateAlert(): AlertEvent | null {
  if (Math.random() > 0.02) return null; // 2% chance per tick
  
  const alertTypes: Array<{ type: AlertType; severity: SeverityLevel; action: string }> = [
    { type: 'disease_detected', severity: 'high', action: 'Initiate targeted spray protocol' },
    { type: 'pest_detected', severity: 'medium', action: 'Mark zone for inspection' },
    { type: 'low_battery', severity: 'medium', action: 'Return to charging station' },
    { type: 'low_pesticide', severity: 'low', action: 'Schedule tank refill' },
    { type: 'hardware_fault', severity: 'critical', action: 'Halt operations and diagnose' },
  ];
  
  const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: alert.type,
    severity: alert.severity,
    confidence: randomInRange(0.75, 0.98),
    timestamp: Date.now(),
    location: { ...telemetryState.position },
    suggestedAction: alert.action,
    acknowledged: false,
  };
}

// Mission simulation
function updateMission(): MissionState | null {
  const store = useRobotStore.getState();
  const currentMission = store.missions.find(m => m.status === 'active');
  
  if (!currentMission) {
    // Maybe start a new mission
    if (Math.random() < 0.005 && store.missions.length < 5) {
      activeMissionId = `mission-${Date.now()}`;
      missionProgress = 0;
      return {
        missionId: activeMissionId,
        type: 'targeted_spray',
        status: 'queued',
        targetCount: Math.floor(randomInRange(3, 12)),
        progress: 0,
        resourceEstimate: {
          batteryRequired: Math.round(randomInRange(10, 25)),
          pesticideRequired: Math.round(randomInRange(5, 15)),
          estimatedDuration: Math.round(randomInRange(120, 360)),
        },
        logs: [
          { timestamp: Date.now(), message: 'Mission created', type: 'info' }
        ],
        createdAt: Date.now(),
      };
    }
    return null;
  }
  
  // Update existing mission
  const newLogs: MissionLog[] = [...currentMission.logs];
  missionProgress = clamp(missionProgress + randomInRange(0.5, 2), 0, 100);
  
  // Add log entries occasionally
  if (Math.random() < 0.1) {
    const logMessages = [
      { message: 'Target acquired', type: 'info' as const },
      { message: 'Spray nozzle activated', type: 'action' as const },
      { message: 'GPIO confirm: valve open', type: 'confirm' as const },
      { message: 'Coverage verified', type: 'info' as const },
      { message: 'Moving to next target', type: 'action' as const },
    ];
    const log = logMessages[Math.floor(Math.random() * logMessages.length)];
    newLogs.push({ timestamp: Date.now(), ...log });
  }
  
  const isComplete = missionProgress >= 100;
  
  return {
    ...currentMission,
    status: isComplete ? 'completed' : 'active',
    progress: Math.round(missionProgress),
    logs: newLogs.slice(-20),
    startedAt: currentMission.startedAt || Date.now(),
    completedAt: isComplete ? Date.now() : undefined,
  };
}

// Mode cycling simulation
let modeCycleCounter = 0;
function updateMode(): RobotMode | null {
  modeCycleCounter++;
  
  // Change mode every ~30-60 seconds
  if (modeCycleCounter < 30 + Math.random() * 30) return null;
  
  modeCycleCounter = 0;
  const modes: RobotMode[] = ['idle', 'scanning', 'spraying', 'scanning', 'returning'];
  const currentMode = useRobotStore.getState().mode;
  const currentIndex = modes.indexOf(currentMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  
  return modes[nextIndex];
}

// Main simulation tick
let simulationInterval: number | null = null;

export function startSimulation() {
  if (simulationInterval) return;
  
  console.log('🤖 SIMULATED STREAM (DEV MODE) - Starting robot data simulation');
  
  const store = useRobotStore.getState();
  store.setSimulating(true);
  
  simulationInterval = window.setInterval(() => {
    const store = useRobotStore.getState();
    if (!store.isSimulating) return;
    
    // Update telemetry (every tick)
    store.updateTelemetry(generateTelemetry());
    
    // Update vision (every tick)
    store.updateVision(generateVision());
    
    // Update health (every 5 ticks)
    if (frameCounter % 5 === 0) {
      store.updateHealth(generateHealth());
    }
    
    // Check for alerts
    const alert = maybeGenerateAlert();
    if (alert) {
      store.addAlert(alert);
      console.log('🚨 SIMULATED ALERT:', alert.type, alert.severity);
    }
    
    // Update mission
    const mission = updateMission();
    if (mission) {
      store.updateMission(mission);
    }
    
    // Mode cycling
    const newMode = updateMode();
    if (newMode) {
      store.setMode(newMode);
      console.log('🔄 SIMULATED MODE CHANGE:', newMode);
    }
    
  }, 500); // 500ms tick rate
}

export function stopSimulation() {
  if (simulationInterval) {
    window.clearInterval(simulationInterval);
    simulationInterval = null;
    useRobotStore.getState().setSimulating(false);
    console.log('🛑 SIMULATED STREAM (DEV MODE) - Simulation stopped');
  }
}

// Reset simulation state
export function resetSimulation() {
  telemetryState = {
    battery: 85,
    pesticide: 72,
    cpu: 45,
    fps: 30,
    latency: 12,
    position: { lat: 37.7749, lng: -122.4194 },
    heading: 45,
    speed: 0.5,
  };
  healthState = {
    score: 78,
    infection: 12,
    leafCount: 1247,
  };
  frameCounter = 0;
  missionProgress = 0;
  modeCycleCounter = 0;
}
