import { motion, AnimatePresence } from 'framer-motion';
import { useRobotStore } from '@/store/useRobotStore';
import { GlowCard } from '@/components/common/GlowCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { MissionState, MissionStatus, MissionType, MissionLog } from '@/types';
import { 
  Target, 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  Battery,
  Droplets,
  Timer,
  Home,
  MapPin,
  Loader2,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const missionTypeIcons: Record<MissionType, typeof Target> = {
  targeted_spray: Target,
  zone_scan: MapPin,
  return_base: Home,
  perimeter_check: MapPin,
};

const statusConfig: Record<MissionStatus, { color: string; icon: typeof CheckCircle }> = {
  queued: { color: 'text-muted-foreground', icon: Clock },
  active: { color: 'text-accent', icon: Loader2 },
  completed: { color: 'text-primary', icon: CheckCircle },
  failed: { color: 'text-destructive', icon: XCircle },
  cancelled: { color: 'text-muted-foreground', icon: XCircle },
};

function MissionCard({ 
  mission, 
  isSelected, 
  onClick 
}: { 
  mission: MissionState; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const Icon = missionTypeIcons[mission.type];
  const StatusIcon = statusConfig[mission.status].icon;
  const isActive = mission.status === 'active';

  return (
    <motion.div
      className={cn(
        'p-4 rounded-lg border border-border cursor-pointer transition-all',
        isActive && 'bg-accent/10 border-accent/30',
        mission.status === 'completed' && 'bg-primary/5',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
      whileHover={{ x: 4 }}
      layout
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          isActive ? 'bg-accent/20' : 'bg-muted/50'
        )}>
          <Icon className={cn('w-5 h-5', isActive ? 'text-accent' : 'text-muted-foreground')} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium capitalize">
              {mission.type.replace(/_/g, ' ')}
            </span>
            <div className="flex items-center gap-1.5">
              <StatusIcon className={cn(
                'w-4 h-4',
                statusConfig[mission.status].color,
                isActive && 'animate-spin'
              )} />
              <span className={cn('text-xs capitalize', statusConfig[mission.status].color)}>
                {mission.status}
              </span>
            </div>
          </div>
          
          {isActive && (
            <div className="mt-2">
              <ProgressBar value={mission.progress} size="sm" />
              <span className="text-xs text-muted-foreground mt-1 block">
                {mission.progress}% complete
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {mission.targetCount} targets
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(mission.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', isSelected && 'rotate-90')} />
      </div>
    </motion.div>
  );
}

function LogEntry({ log, index }: { log: MissionLog; index: number }) {
  const typeStyles = {
    info: 'text-muted-foreground',
    action: 'text-accent',
    confirm: 'text-primary',
    warning: 'text-secondary',
    error: 'text-destructive',
  };

  return (
    <motion.div
      className="flex items-start gap-2 text-sm font-mono"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <span className="text-muted-foreground text-xs w-20 flex-shrink-0">
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span className={cn('uppercase text-xs w-16 flex-shrink-0', typeStyles[log.type])}>
        [{log.type}]
      </span>
      <span className="text-foreground">{log.message}</span>
    </motion.div>
  );
}

function MissionDetail({ mission }: { mission: MissionState }) {
  const Icon = missionTypeIcons[mission.type];
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isActive = mission.status === 'active';

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [mission.logs.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-3 rounded-xl',
            isActive ? 'bg-accent/20' : 'bg-muted/50'
          )}>
            <Icon className={cn('w-6 h-6', isActive ? 'text-accent' : 'text-muted-foreground')} />
          </div>
          <div>
            <h3 className="text-lg font-semibold capitalize">
              {mission.type.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              {mission.missionId}
            </p>
          </div>
          <div className="ml-auto">
            <motion.div
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold uppercase',
                isActive && 'bg-accent/20 text-accent animate-pulse-glow'
              )}
              animate={isActive ? { boxShadow: ['0 0 0 0 transparent', '0 0 20px hsl(var(--accent) / 0.3)', '0 0 0 0 transparent'] } : {}}
              transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            >
              {mission.status}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Progress & Stats */}
      <div className="p-4 border-b border-border">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-mono">{mission.progress}%</span>
          </div>
          <ProgressBar value={mission.progress} size="lg" />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Targets</span>
            </div>
            <span className="text-lg font-semibold">{mission.targetCount}</span>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Battery className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Battery Req.</span>
            </div>
            <span className="text-lg font-semibold">{mission.resourceEstimate.batteryRequired}%</span>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Pesticide Req.</span>
            </div>
            <span className="text-lg font-semibold">{mission.resourceEstimate.pesticideRequired}%</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span>Est. Duration: {Math.floor(mission.resourceEstimate.estimatedDuration / 60)}m {mission.resourceEstimate.estimatedDuration % 60}s</span>
        </div>
      </div>
      
      {/* Execution Logs */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Execution Logs</span>
          {isActive && (
            <span className="ml-auto text-xs text-muted-foreground typewriter-cursor">
              Streaming
            </span>
          )}
        </div>
        
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-auto p-4 bg-background/50 space-y-1"
        >
          <AnimatePresence>
            {mission.logs.map((log, index) => (
              <LogEntry key={`${log.timestamp}-${index}`} log={log} index={index} />
            ))}
          </AnimatePresence>
          
          {mission.logs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No logs yet
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Missions() {
  const { missions, telemetry } = useRobotStore();
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  const queuedMissions = missions.filter(m => m.status === 'queued');
  const activeMission = missions.find(m => m.status === 'active');
  const completedMissions = missions.filter(m => m.status === 'completed' || m.status === 'failed');

  const selectedMission = missions.find(m => m.missionId === selectedMissionId) || activeMission;

  // Auto-select active mission
  useEffect(() => {
    if (activeMission && !selectedMissionId) {
      setSelectedMissionId(activeMission.missionId);
    }
  }, [activeMission, selectedMissionId]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Missions & Spray Control</h1>
          <p className="text-sm text-muted-foreground">
            {queuedMissions.length} queued • {activeMission ? '1 active' : 'None active'} • {completedMissions.length} completed
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" className="btn-permission">
            <MapPin className="w-4 h-4 mr-2" />
            Mark Zone
          </Button>
          <Button variant="outline" className="btn-permission">
            <Home className="w-4 h-4 mr-2" />
            Return to Base
          </Button>
          <Button className="btn-permission bg-primary hover:bg-primary/90">
            <Target className="w-4 h-4 mr-2" />
            Authorize Targeted Spray
          </Button>
        </div>
      </div>

      {/* Resource Status */}
      <div className="grid grid-cols-2 gap-4">
        <GlowCard className="flex items-center gap-4">
          <Battery className={cn(
            'w-6 h-6',
            telemetry.battery < 20 ? 'text-destructive' : 'text-primary'
          )} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Battery Available</span>
              <span className="font-mono">{telemetry.battery.toFixed(1)}%</span>
            </div>
            <ProgressBar value={telemetry.battery} variant="battery" size="sm" />
          </div>
        </GlowCard>
        
        <GlowCard className="flex items-center gap-4">
          <Droplets className={cn(
            'w-6 h-6',
            telemetry.pesticide < 20 ? 'text-destructive' : 'text-secondary'
          )} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Pesticide Tank</span>
              <span className="font-mono">{telemetry.pesticide.toFixed(1)}%</span>
            </div>
            <ProgressBar value={telemetry.pesticide} variant="tank" size="sm" />
          </div>
        </GlowCard>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Mission Queue */}
        <motion.div
          className="col-span-5 overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <GlowCard className="h-full flex flex-col p-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Mission Queue</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {/* Active Mission */}
              {activeMission && (
                <div className="mb-4">
                  <p className="text-xs text-accent uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Play className="w-3 h-3" />
                    Active
                  </p>
                  <MissionCard
                    mission={activeMission}
                    isSelected={selectedMissionId === activeMission.missionId}
                    onClick={() => setSelectedMissionId(activeMission.missionId)}
                  />
                </div>
              )}
              
              {/* Queued */}
              {queuedMissions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Queued ({queuedMissions.length})
                  </p>
                  <div className="space-y-2">
                    {queuedMissions.map(mission => (
                      <MissionCard
                        key={mission.missionId}
                        mission={mission}
                        isSelected={selectedMissionId === mission.missionId}
                        onClick={() => setSelectedMissionId(mission.missionId)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Completed */}
              {completedMissions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Completed ({completedMissions.length})
                  </p>
                  <div className="space-y-2">
                    {completedMissions.slice(0, 5).map(mission => (
                      <MissionCard
                        key={mission.missionId}
                        mission={mission}
                        isSelected={selectedMissionId === mission.missionId}
                        onClick={() => setSelectedMissionId(mission.missionId)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {missions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No missions in queue</p>
                  <p className="text-sm">Missions will appear when alerts are authorized</p>
                </div>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {/* Mission Detail */}
        <motion.div
          className="col-span-7 overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard 
            className="h-full p-0" 
            glowColor={selectedMission?.status === 'active' ? 'accent' : 'none'}
          >
            {selectedMission ? (
              <MissionDetail mission={selectedMission} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No mission selected</p>
                  <p className="text-sm">Select a mission or authorize a new spray operation</p>
                </div>
              </div>
            )}
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}
