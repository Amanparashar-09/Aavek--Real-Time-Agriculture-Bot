import { motion, AnimatePresence } from 'framer-motion';
import { useRobotStore } from '@/store/useRobotStore';
import { GlowCard } from '@/components/common/GlowCard';
import { AnimatedValue } from '@/components/common/AnimatedValue';
import { DetectionBox } from '@/types';
import { Camera, Clock, Hash, Target, ImageIcon, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

function DetectionOverlay({ boxes, width = 640, height = 480 }: { boxes: DetectionBox[]; width?: number; height?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            className="detection-box"
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
              borderColor: box.color,
              color: box.color,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute -top-6 left-0 px-2 py-0.5 text-xs font-mono rounded whitespace-nowrap"
              style={{ backgroundColor: box.color }}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <span className="text-background font-semibold">{box.label}</span>
              <span className="text-background/80 ml-2">{(box.confidence * 100).toFixed(0)}%</span>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SnapshotGallery({ snapshots }: { snapshots: Array<{ frameId: number; timestamp: number; boxes: DetectionBox[] }> }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {snapshots.map((snapshot, index) => (
        <motion.div
          key={snapshot.frameId}
          className="relative aspect-video bg-muted/50 rounded-lg overflow-hidden group cursor-pointer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Placeholder for snapshot image */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
          </div>
          
          {/* Detection count badge */}
          {snapshot.boxes.length > 0 && (
            <div className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded font-mono">
              {snapshot.boxes.length}
            </div>
          )}
          
          {/* Timestamp */}
          <div className="absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm px-2 py-1">
            <p className="text-[10px] text-muted-foreground font-mono">
              F#{snapshot.frameId}
            </p>
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="w-4 h-4 text-primary" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function LiveVision() {
  const { vision, telemetry, mode } = useRobotStore();
  const [snapshots, setSnapshots] = useState<Array<{ frameId: number; timestamp: number; boxes: DetectionBox[] }>>([]);
  const [detectionList, setDetectionList] = useState<Array<DetectionBox & { frameId: number }>>([]);

  // Collect snapshots and detections
  useEffect(() => {
    if (vision.boxes.length > 0) {
      setSnapshots(prev => [
        { frameId: vision.frameId, timestamp: vision.timestamp, boxes: vision.boxes },
        ...prev
      ].slice(0, 6));
      
      setDetectionList(prev => [
        ...vision.boxes.map(b => ({ ...b, frameId: vision.frameId })),
        ...prev
      ].slice(0, 20));
    }
  }, [vision.frameId]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Vision</h1>
          <p className="text-sm text-muted-foreground">Real-time camera feed with YOLO detection overlay</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="w-4 h-4" />
            <AnimatedValue value={telemetry.fps} suffix=" FPS" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="w-4 h-4" />
            <span className="font-mono">F#{vision.frameId}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main Camera Feed */}
        <motion.div
          className="col-span-8"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard className="p-0 overflow-hidden" glowColor="accent">
            {/* Camera Panel */}
            <div className="relative aspect-video bg-gradient-to-br from-muted/50 to-muted">
              {/* Placeholder pattern for video feed */}
              <div className="absolute inset-0 opacity-30">
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.1) 0%, transparent 30%),
                      radial-gradient(circle at 70% 60%, hsl(var(--accent) / 0.1) 0%, transparent 40%),
                      linear-gradient(135deg, transparent 40%, hsl(var(--muted) / 0.3) 50%, transparent 60%)
                    `,
                  }}
                />
              </div>
              
              {/* Scan line animation when scanning */}
              {mode === 'scanning' && (
                <motion.div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              )}
              
              {/* Detection overlays */}
              <DetectionOverlay boxes={vision.boxes} />
              
              {/* HUD Overlay */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="hud-text bg-background/60 backdrop-blur-sm px-2 py-1 rounded">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(vision.timestamp).toLocaleTimeString()}
                </div>
                <div className="hud-text bg-background/60 backdrop-blur-sm px-2 py-1 rounded">
                  Frame #{vision.frameId}
                </div>
              </div>
              
              <div className="absolute top-4 right-4">
                <div className="hud-text bg-background/60 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-destructive"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  LIVE
                </div>
              </div>
              
              <div className="absolute bottom-4 left-4">
                <div className="hud-text bg-background/60 backdrop-blur-sm px-2 py-1 rounded">
                  Detections: {vision.boxes.length}
                </div>
              </div>
              
              <div className="absolute bottom-4 right-4">
                <div className="hud-text bg-background/60 backdrop-blur-sm px-2 py-1 rounded">
                  {telemetry.fps} FPS | {telemetry.latency}ms
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Right Column - Detections & Snapshots */}
        <motion.div
          className="col-span-4 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Detection List */}
          <GlowCard className="max-h-[300px] overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Detection Stream
            </h3>
            
            <div className="flex-1 overflow-auto space-y-2 pr-2">
              <AnimatePresence>
                {detectionList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No detections yet
                  </p>
                ) : (
                  detectionList.map((detection, index) => (
                    <motion.div
                      key={`${detection.id}-${index}`}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: detection.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{detection.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          F#{detection.frameId} • {(detection.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </GlowCard>

          {/* Snapshot Gallery */}
          <GlowCard>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" />
              Recent Snapshots
            </h3>
            
            {snapshots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Snapshots will appear when detections occur
              </p>
            ) : (
              <SnapshotGallery snapshots={snapshots} />
            )}
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}
