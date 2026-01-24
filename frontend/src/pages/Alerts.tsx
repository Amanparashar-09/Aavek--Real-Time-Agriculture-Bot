import { motion, AnimatePresence } from 'framer-motion';
import { useRobotStore } from '@/store/useRobotStore';
import { GlowCard } from '@/components/common/GlowCard';
import { AlertEvent, SeverityLevel, AlertType } from '@/types';
import { 
  AlertTriangle, 
  Bug, 
  Battery, 
  Droplets, 
  AlertCircle, 
  MapPin,
  Filter,
  Check,
  Target,
  Clock,
  ImageIcon,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const alertTypeIcons: Record<AlertType, typeof AlertTriangle> = {
  disease_detected: AlertCircle,
  pest_detected: Bug,
  low_battery: Battery,
  low_pesticide: Droplets,
  hardware_fault: AlertTriangle,
  boundary_breach: MapPin,
};

const severityColors: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive/30' },
  high: { bg: 'bg-secondary/20', text: 'text-secondary', border: 'border-secondary/30' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  low: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
};

function AlertItem({ 
  alert, 
  isSelected, 
  onClick,
  isNew 
}: { 
  alert: AlertEvent; 
  isSelected: boolean; 
  onClick: () => void;
  isNew: boolean;
}) {
  const Icon = alertTypeIcons[alert.type];
  const colors = severityColors[alert.severity];

  return (
    <motion.div
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all',
        colors.bg,
        colors.border,
        isSelected && 'ring-2 ring-primary',
        !alert.acknowledged && 'border-l-4',
        isNew && 'alert-flash',
        alert.severity === 'critical' && !alert.acknowledged && 'critical-shake'
      )}
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      layout
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('w-4 h-4', colors.text)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium capitalize">
              {alert.type.replace(/_/g, ' ')}
            </span>
            <span className={cn('text-xs uppercase font-semibold', colors.text)}>
              {alert.severity}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(alert.timestamp).toLocaleTimeString()}
            <span className="mx-1">•</span>
            <span>{(alert.confidence * 100).toFixed(0)}% confidence</span>
          </div>
        </div>
        
        {alert.acknowledged && (
          <Check className="w-4 h-4 text-primary flex-shrink-0" />
        )}
        
        <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', isSelected && 'rotate-90')} />
      </div>
    </motion.div>
  );
}

function AlertDetail({ alert, onAcknowledge, onAuthorize }: { 
  alert: AlertEvent; 
  onAcknowledge: () => void;
  onAuthorize: () => void;
}) {
  const Icon = alertTypeIcons[alert.type];
  const colors = severityColors[alert.severity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className={cn('p-4 rounded-t-lg border-b', colors.bg, colors.border)}>
        <div className="flex items-center gap-3">
          <div className={cn('p-3 rounded-xl', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.text)} />
          </div>
          <div>
            <h3 className="text-lg font-semibold capitalize">
              {alert.type.replace(/_/g, ' ')}
            </h3>
            <p className="text-sm text-muted-foreground">
              Alert ID: {alert.id.slice(0, 12)}...
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Snapshot Preview */}
        <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center border border-border">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Snapshot available</p>
            <p className="text-xs">Frame captured at detection time</p>
          </div>
        </div>
        
        {/* Detection Metadata */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Severity</p>
            <p className={cn('text-sm font-semibold uppercase', colors.text)}>
              {alert.severity}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <p className="text-sm font-semibold">
              {(alert.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Location</p>
            <p className="text-sm font-mono">
              {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Time</p>
            <p className="text-sm font-mono">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Suggested Action */}
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold">Suggested Action</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {alert.suggestedAction}
          </p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-border flex gap-3">
        {!alert.acknowledged && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={onAcknowledge}
          >
            <Check className="w-4 h-4 mr-2" />
            Acknowledge
          </Button>
        )}
        <Button
          className="flex-1 btn-permission bg-primary hover:bg-primary/90"
          onClick={onAuthorize}
        >
          <Target className="w-4 h-4 mr-2" />
          Authorize Mission
        </Button>
      </div>
    </motion.div>
  );
}

export default function Alerts() {
  const { alerts, acknowledgeAlert } = useRobotStore();
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (typeFilter !== 'all' && alert.type !== typeFilter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const selectedAlert = alerts.find(a => a.id === selectedAlertId);
  const unacknowledged = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {unacknowledged} unacknowledged • {alerts.length} total
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as SeverityLevel | 'all')}
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as AlertType | 'all')}
            >
              <option value="all">All Types</option>
              <option value="disease_detected">Disease</option>
              <option value="pest_detected">Pest</option>
              <option value="low_battery">Battery</option>
              <option value="low_pesticide">Pesticide</option>
              <option value="hardware_fault">Hardware</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Alert List */}
        <motion.div
          className="col-span-5 overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <GlowCard className="h-full flex flex-col p-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Alert Stream</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-2">
              <AnimatePresence>
                {filteredAlerts.length === 0 ? (
                  <motion.div
                    className="text-center py-8 text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No alerts match your filters</p>
                  </motion.div>
                ) : (
                  filteredAlerts.map((alert, index) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      isSelected={selectedAlertId === alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      isNew={index === 0 && Date.now() - alert.timestamp < 2000}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </GlowCard>
        </motion.div>

        {/* Alert Detail */}
        <motion.div
          className="col-span-7 overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard className="h-full p-0" glowColor={selectedAlert ? 
            (selectedAlert.severity === 'critical' ? 'alert' : 'accent') : 'none'
          }>
            {selectedAlert ? (
              <AlertDetail
                alert={selectedAlert}
                onAcknowledge={() => acknowledgeAlert(selectedAlert.id)}
                onAuthorize={() => {
                  // Would create a mission targeting this alert
                  console.log('Authorize mission for alert:', selectedAlert.id);
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">Select an alert</p>
                  <p className="text-sm">Click on an alert to view details</p>
                </div>
              </div>
            )}
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}
