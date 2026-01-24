import { motion } from 'framer-motion';
import { useRobotStore } from '@/store/useRobotStore';
import { GlowCard } from '@/components/common/GlowCard';
import { AnimatedValue } from '@/components/common/AnimatedValue';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StatusChip } from '@/components/common/StatusChip';
import { 
  Bot, 
  Thermometer, 
  Droplet, 
  Cpu, 
  Gauge, 
  Timer,
  MapPin,
  Compass,
  Activity,
  Leaf,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bot marker
const botIcon = L.divIcon({
  className: 'bot-marker',
  html: `<div class="w-6 h-6 bg-primary rounded-full border-2 border-background shadow-lg flex items-center justify-center">
    <svg class="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L4 12l8 10 8-10-8-10z"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

export default function Overview() {
  const { telemetry, health, system, mode, alerts, missions, positionTrail } = useRobotStore();
  
  const activeMission = missions.find(m => m.status === 'active');
  const recentEvents = [
    ...alerts.slice(0, 3).map(a => ({ 
      type: 'alert' as const, 
      time: a.timestamp, 
      text: a.type.replace('_', ' '),
      severity: a.severity 
    })),
    ...missions.slice(0, 2).map(m => ({ 
      type: 'mission' as const, 
      time: m.createdAt, 
      text: `${m.type.replace('_', ' ')} - ${m.status}`,
      severity: 'info' as const
    })),
  ].sort((a, b) => b.time - a.time).slice(0, 5);

  const position: [number, number] = [telemetry.position.lat, telemetry.position.lng];
  const trail: [number, number][] = positionTrail.map(p => [p.lat, p.lng]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
          <p className="text-sm text-muted-foreground">Real-time robot overview and status</p>
        </div>
        <StatusChip mode={mode} className="text-sm px-4 py-1.5" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Bot Card - Digital Twin Summary */}
        <motion.div
          className="col-span-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard glowColor="primary" className="h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{system.botName}</h2>
                <p className="text-xs text-muted-foreground font-mono">{system.botId}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Position & Heading */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Position</p>
                    <p className="text-sm font-mono">
                      {telemetry.position.lat.toFixed(4)}, {telemetry.position.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Heading</p>
                    <p className="text-sm font-mono">{telemetry.heading}°</p>
                  </div>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-muted-foreground">Temp</span>
                  </div>
                  <AnimatedValue value={telemetry.temperature || 0} suffix="°C" decimals={1} className="text-lg font-semibold" />
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplet className="w-4 h-4 text-accent" />
                    <span className="text-xs text-muted-foreground">Humidity</span>
                  </div>
                  <AnimatedValue value={telemetry.humidity || 0} suffix="%" className="text-lg font-semibold" />
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">CPU</span>
                  </div>
                  <AnimatedValue value={telemetry.cpu} suffix="%" className="text-lg font-semibold" />
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">FPS</span>
                  </div>
                  <AnimatedValue value={telemetry.fps} className="text-lg font-semibold" />
                </div>
              </div>

              {/* Uptime */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>Uptime: {Math.floor(system.uptime / 3600)}h {Math.floor((system.uptime % 3600) / 60)}m</span>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Mission Timeline */}
        <motion.div
          className="col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlowCard className="h-full">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              Event Timeline
            </h3>

            <div className="space-y-3">
              {activeMission && (
                <motion.div
                  className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary uppercase">Active Mission</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {activeMission.progress}%
                    </span>
                  </div>
                  <p className="text-sm mb-2">{activeMission.type.replace('_', ' ')}</p>
                  <ProgressBar value={activeMission.progress} variant="default" size="sm" />
                </motion.div>
              )}

              {recentEvents.map((event, index) => (
                <motion.div
                  key={`${event.type}-${event.time}`}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    event.type === 'alert' 
                      ? event.severity === 'critical' ? 'bg-destructive' : 'bg-secondary'
                      : 'bg-primary'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm capitalize">{event.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.time).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}

              {recentEvents.length === 0 && !activeMission && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent events
                </p>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {/* Quick Health Snapshot */}
        <motion.div
          className="col-span-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlowCard glowColor="accent" className="h-full">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              Plant Health Snapshot
            </h3>

            {/* Health Score */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={301.59}
                    initial={{ strokeDashoffset: 301.59 }}
                    animate={{ strokeDashoffset: 301.59 - (301.59 * health.plantHealthScore / 100) }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatedValue value={health.plantHealthScore} className="text-2xl font-bold" />
                  <span className="text-xs text-muted-foreground">Health</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Infection</span>
                </div>
                <AnimatedValue 
                  value={health.infectionPercent} 
                  suffix="%" 
                  decimals={1}
                  className="text-lg font-semibold" 
                />
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <Leaf className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Leaves</span>
                </div>
                <AnimatedValue 
                  value={health.leafCount} 
                  className="text-lg font-semibold" 
                />
              </div>
            </div>

            {/* Severity Indicator */}
            <div className="mt-4 flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">Severity Level</span>
              <span className={`text-xs font-semibold uppercase ${
                health.severityLevel === 'critical' ? 'text-destructive' :
                health.severityLevel === 'high' ? 'text-secondary' :
                health.severityLevel === 'medium' ? 'text-yellow-400' :
                'text-primary'
              }`}>
                {health.severityLevel}
              </span>
            </div>
          </GlowCard>
        </motion.div>

        {/* Mini Map (motion-free to isolate context issue) */}
        <div className="col-span-12">
          <div className="p-4 border border-border rounded-lg overflow-hidden">
            <div className="pb-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Bot Position & Trail
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Speed:</span>
                <AnimatedValue value={telemetry.speed} suffix=" m/s" decimals={1} />
              </div>
            </div>
            <div className="h-64">
              <MapContainer
                center={position}
                zoom={18}
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                <MapUpdater position={position} />
                {trail.length > 1 && (
                  <Polyline
                    positions={trail}
                    color="hsl(142, 70%, 45%)"
                    weight={3}
                    opacity={0.7}
                  />
                )}
                <Marker position={position} icon={botIcon} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
