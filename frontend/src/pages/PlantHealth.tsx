import { motion } from 'framer-motion';
import { useRobotStore } from '@/store/useRobotStore';
import { GlowCard } from '@/components/common/GlowCard';
import { AnimatedValue } from '@/components/common/AnimatedValue';
import { 
  Leaf, 
  AlertTriangle, 
  Activity, 
  TrendingUp,
  TrendingDown,
  Grid3X3,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

function HealthGauge({ value, label, size = 120 }: { value: number; label: string; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * value / 100);
  
  const getColor = (v: number) => {
    if (v >= 80) return 'hsl(var(--health-excellent))';
    if (v >= 60) return 'hsl(var(--health-good))';
    if (v >= 40) return 'hsl(var(--health-moderate))';
    if (v >= 20) return 'hsl(var(--health-poor))';
    return 'hsl(var(--health-critical))';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(value)}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedValue value={value} className="text-3xl font-bold" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function HeatmapCell({ value, label }: { value: number; label: string }) {
  const getIntensity = (v: number) => {
    if (v >= 30) return 'bg-health-critical/80';
    if (v >= 20) return 'bg-health-poor/70';
    if (v >= 10) return 'bg-health-moderate/60';
    if (v >= 5) return 'bg-health-good/50';
    return 'bg-health-excellent/40';
  };

  return (
    <motion.div
      className={`aspect-square rounded-lg ${getIntensity(value)} flex flex-col items-center justify-center p-2 transition-colors duration-300`}
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-lg font-bold text-foreground">{value.toFixed(0)}%</span>
      <span className="text-[10px] text-foreground/70 text-center">{label}</span>
    </motion.div>
  );
}

export default function PlantHealth() {
  const { health, healthHistory } = useRobotStore();
  
  // Prepare chart data
  const chartData = healthHistory.score.map((point, index) => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    score: point.value,
    infection: healthHistory.infection[index]?.value || 0,
  }));

  const latestScore = healthHistory.score[healthHistory.score.length - 1]?.value || health.plantHealthScore;
  const previousScore = healthHistory.score[healthHistory.score.length - 2]?.value || latestScore;
  const scoreTrend = latestScore - previousScore;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plant Health Intelligence</h1>
          <p className="text-sm text-muted-foreground">AI-powered crop health analysis and monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Last Updated:</span>
          <span className="font-mono">{new Date(health.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Health Score Gauge */}
        <motion.div
          className="col-span-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard glowColor="primary" className="flex flex-col items-center py-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              Overall Health Score
            </h3>
            
            <HealthGauge value={health.plantHealthScore} label="Health" size={160} />
            
            <div className="mt-4 flex items-center gap-2">
              {scoreTrend > 0 ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : scoreTrend < 0 ? (
                <TrendingDown className="w-4 h-4 text-destructive" />
              ) : (
                <Activity className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={`text-sm ${
                scoreTrend > 0 ? 'text-primary' : scoreTrend < 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {scoreTrend > 0 ? '+' : ''}{scoreTrend.toFixed(1)} from last reading
              </span>
            </div>
          </GlowCard>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="col-span-8 grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Infection Rate */}
          <GlowCard glowColor="alert">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold">Infection Rate</span>
            </div>
            <AnimatedValue 
              value={health.infectionPercent} 
              suffix="%" 
              decimals={1}
              className="text-3xl font-bold" 
            />
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-secondary to-destructive"
                initial={{ width: 0 }}
                animate={{ width: `${health.infectionPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Target: &lt;5%
            </p>
          </GlowCard>

          {/* Severity Level */}
          <GlowCard>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold">Severity Level</span>
            </div>
            <motion.div
              className={`text-3xl font-bold uppercase ${
                health.severityLevel === 'critical' ? 'text-destructive' :
                health.severityLevel === 'high' ? 'text-secondary' :
                health.severityLevel === 'medium' ? 'text-yellow-400' :
                'text-primary'
              }`}
              animate={health.severityLevel === 'critical' ? {
                scale: [1, 1.02, 1],
              } : {}}
              transition={{ duration: 0.5, repeat: health.severityLevel === 'critical' ? Infinity : 0 }}
            >
              {health.severityLevel}
            </motion.div>
            <p className="mt-2 text-xs text-muted-foreground">
              Based on infection patterns
            </p>
          </GlowCard>

          {/* Leaf Count */}
          <GlowCard glowColor="accent">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Leaves Analyzed</span>
            </div>
            <AnimatedValue 
              value={health.leafCount} 
              className="text-3xl font-bold" 
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Across all monitored zones
            </p>
          </GlowCard>
        </motion.div>

        {/* Zone Heatmap */}
        <motion.div
          className="col-span-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlowCard>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-accent" />
              Zone Infection Heatmap
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              {health.zoneStats.map((zone) => (
                <HeatmapCell 
                  key={zone.zoneId}
                  value={zone.infectionLevel}
                  label={zone.zoneName}
                />
              ))}
              {/* Add placeholder cells to fill grid */}
              {Array.from({ length: Math.max(0, 6 - health.zoneStats.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-lg bg-muted/20" />
              ))}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-health-excellent/40" />
                Low
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-health-moderate/60" />
                Medium
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-health-critical/80" />
                High
              </span>
            </div>
          </GlowCard>
        </motion.div>

        {/* Trend Chart */}
        <motion.div
          className="col-span-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlowCard>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Health & Infection Trends
            </h3>
            
            <div className="h-64">
              {chartData.length > 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInfection" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(215, 15%, 55%)" 
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(215, 15%, 55%)" 
                      fontSize={10}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(220, 20%, 10%)',
                        border: '1px solid hsl(220, 15%, 18%)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Health Score"
                      stroke="hsl(142, 70%, 45%)"
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="infection"
                      name="Infection %"
                      stroke="hsl(0, 85%, 55%)"
                      fillOpacity={1}
                      fill="url(#colorInfection)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Collecting data points...</p>
                </div>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {/* Zone Details */}
        <motion.div
          className="col-span-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlowCard>
            <h3 className="text-sm font-semibold text-foreground mb-4">Zone Details</h3>
            
            <div className="grid grid-cols-3 gap-4">
              {health.zoneStats.map((zone, index) => (
                <motion.div
                  key={zone.zoneId}
                  className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{zone.zoneName}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      zone.infectionLevel > 20 ? 'bg-destructive/20 text-destructive' :
                      zone.infectionLevel > 10 ? 'bg-secondary/20 text-secondary' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {zone.infectionLevel.toFixed(1)}% infected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Leaves</p>
                      <p className="font-mono">{zone.leafCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Scan</p>
                      <p className="font-mono text-xs">
                        {new Date(zone.lastScanned).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}
