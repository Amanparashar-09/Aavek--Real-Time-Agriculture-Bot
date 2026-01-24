import { motion } from 'framer-motion';
import { useRobotStore } from '@/store/useRobotStore';
import { StatusChip } from '@/components/common/StatusChip';
import { ProgressBar } from '@/components/common/ProgressBar';
import { AnimatedValue } from '@/components/common/AnimatedValue';
import { 
  Battery, 
  Droplets, 
  Wifi, 
  WifiOff, 
  Camera, 
  Cog, 
  Sprout,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceHealth } from '@/types';

const deviceHealthIcons: Record<DeviceHealth, { color: string; className: string }> = {
  healthy: { color: 'text-primary', className: '' },
  degraded: { color: 'text-secondary', className: 'animate-pulse' },
  fault: { color: 'text-destructive', className: 'animate-ping-slow' },
};

export function StatusBar() {
  const { 
    mode, 
    telemetry, 
    system, 
    isOnline, 
    isSimulating,
    lastUpdate 
  } = useRobotStore();

  const timeSinceUpdate = Math.floor((Date.now() - lastUpdate) / 1000);

  return (
    <motion.header
      className="sticky top-0 z-50 glass-panel rounded-none border-x-0 border-t-0 px-4 py-2"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Bot Identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
              animate={{ rotate: mode === 'scanning' ? 360 : 0 }}
              transition={{ duration: 2, repeat: mode === 'scanning' ? Infinity : 0, ease: 'linear' }}
            >
              <Sprout className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">{system.botName}</h1>
              <p className="text-xs text-muted-foreground font-mono">{system.botId}</p>
            </div>
          </div>
          
          <StatusChip mode={mode} />
          
          {isSimulating && (
            <span className="text-[10px] text-secondary font-mono uppercase tracking-wider bg-secondary/10 px-2 py-0.5 rounded">
              SIMULATED STREAM (DEV MODE)
            </span>
          )}
        </div>

        {/* Telemetry Indicators */}
        <div className="flex items-center gap-6">
          {/* Battery */}
          <div className="flex items-center gap-2 min-w-[100px]">
            <Battery className={cn(
              'w-4 h-4',
              telemetry.battery < 20 ? 'text-destructive' : 'text-primary'
            )} />
            <div className="flex-1">
              <ProgressBar 
                value={telemetry.battery} 
                variant="battery" 
                size="sm" 
              />
            </div>
            <AnimatedValue 
              value={telemetry.battery} 
              suffix="%" 
              className="text-xs font-mono w-10 text-right"
            />
          </div>

          {/* Pesticide Tank */}
          <div className="flex items-center gap-2 min-w-[100px]">
            <Droplets className={cn(
              'w-4 h-4',
              telemetry.pesticide < 20 ? 'text-destructive' : 'text-secondary'
            )} />
            <div className="flex-1">
              <ProgressBar 
                value={telemetry.pesticide} 
                variant="tank" 
                size="sm" 
              />
            </div>
            <AnimatedValue 
              value={telemetry.pesticide} 
              suffix="%" 
              className="text-xs font-mono w-10 text-right"
            />
          </div>

          {/* Network Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="relative">
                  <Wifi className="w-4 h-4 text-primary" />
                  <motion.div
                    className="absolute inset-0 bg-primary rounded-full opacity-30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  <AnimatedValue value={telemetry.latency} suffix="ms" />
                </span>
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center gap-1.5"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <WifiOff className="w-4 h-4 text-destructive" />
                <span className="text-xs text-destructive">Offline</span>
              </motion.div>
            )}
          </div>

          {/* Device Health Indicators */}
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="flex items-center gap-1.5" title="Camera">
              <Camera className={cn(
                'w-4 h-4',
                deviceHealthIcons[system.deviceHealth.camera].color,
                deviceHealthIcons[system.deviceHealth.camera].className
              )} />
            </div>
            <div className="flex items-center gap-1.5" title="Motors">
              <Cog className={cn(
                'w-4 h-4',
                deviceHealthIcons[system.deviceHealth.motors].color,
                deviceHealthIcons[system.deviceHealth.motors].className
              )} />
            </div>
            <div className="flex items-center gap-1.5" title="Sprayer">
              <Droplets className={cn(
                'w-4 h-4',
                deviceHealthIcons[system.deviceHealth.sprayer].color,
                deviceHealthIcons[system.deviceHealth.sprayer].className
              )} />
            </div>
            <div className="flex items-center gap-1.5" title="GPS">
              <Activity className={cn(
                'w-4 h-4',
                deviceHealthIcons[system.deviceHealth.gps].color,
                deviceHealthIcons[system.deviceHealth.gps].className
              )} />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
