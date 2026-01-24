import { motion } from 'framer-motion';
import { useRobotStore } from '@/store/useRobotStore';
import { GlowCard } from '@/components/common/GlowCard';
import { AnimatedValue } from '@/components/common/AnimatedValue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Settings, Cpu, Activity, Clock, Gauge, HardDrive, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistorySystem() {
  const { telemetry, telemetryHistory, system, detectionHistory } = useRobotStore();

  const cpuData = telemetryHistory.cpu.map((p, i) => ({
    time: new Date(p.timestamp).toLocaleTimeString(),
    cpu: p.value,
    latency: telemetryHistory.latency[i]?.value || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">History & System</h1>
          <p className="text-sm text-muted-foreground">System transparency and historical data</p>
        </div>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/20">
            <History className="w-4 h-4 mr-2" />History
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-primary/20">
            <Settings className="w-4 h-4 mr-2" />System
          </TabsTrigger>
          <TabsTrigger value="models" className="data-[state=active]:bg-primary/20">
            <Cpu className="w-4 h-4 mr-2" />Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <GlowCard>
            <h3 className="font-semibold mb-4">Detection Timeline</h3>
            <div className="space-y-2 max-h-96 overflow-auto">
              {detectionHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No detection history yet</p>
              ) : (
                detectionHistory.slice(0, 20).map((d, i) => (
                  <motion.div key={d.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{new Date(d.timestamp).toLocaleTimeString()}</span>
                    <span className="text-sm font-medium">{d.type}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{(d.confidence * 100).toFixed(0)}%</span>
                  </motion.div>
                ))
              )}
            </div>
          </GlowCard>
        </TabsContent>

        <TabsContent value="system" className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: Cpu, label: 'CPU', value: telemetry.cpu, suffix: '%' },
              { icon: Gauge, label: 'FPS', value: telemetry.fps, suffix: '' },
              { icon: Activity, label: 'Latency', value: telemetry.latency, suffix: 'ms' },
              { icon: Clock, label: 'Uptime', value: Math.floor(system.uptime / 3600), suffix: 'h' },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlowCard className="text-center">
                  <item.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <AnimatedValue value={item.value} suffix={item.suffix} className="text-2xl font-bold" />
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>

          <GlowCard>
            <h3 className="font-semibold mb-4">CPU & Latency Trend</h3>
            <div className="h-64">
              {cpuData.length > 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cpuData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis dataKey="time" stroke="hsl(215, 15%, 55%)" fontSize={10} />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 20%, 10%)', border: '1px solid hsl(220, 15%, 18%)', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="cpu" stroke="hsl(142, 70%, 45%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="latency" stroke="hsl(190, 90%, 45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-muted-foreground">Collecting data...</div>}
            </div>
          </GlowCard>
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {system.models.map((model, i) => (
              <motion.div key={model.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                <GlowCard glowColor="accent">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-accent/20"><Cpu className="w-5 h-5 text-accent" /></div>
                    <div>
                      <h4 className="font-semibold">{model.name}</h4>
                      <p className="text-xs text-muted-foreground">v{model.version}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Hash</p><p className="font-mono">{model.hash}</p></div>
                    <div><p className="text-xs text-muted-foreground">Input</p><p className="font-mono">{model.inputShape}</p></div>
                    <div><p className="text-xs text-muted-foreground">Runtime</p><p>{model.runtime}</p></div>
                    <div><p className="text-xs text-muted-foreground">Inference</p><p className="flex items-center gap-1"><Zap className="w-3 h-3 text-secondary" />{model.inferenceTimeMs}ms</p></div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
