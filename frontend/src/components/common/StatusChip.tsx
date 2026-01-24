import { motion } from 'framer-motion';
import { RobotMode } from '@/types';
import { cn } from '@/lib/utils';

interface StatusChipProps {
  mode: RobotMode;
  className?: string;
}

const modeConfig: Record<RobotMode, { label: string; className: string; pulse: boolean }> = {
  idle: {
    label: 'IDLE',
    className: 'bg-muted text-muted-foreground',
    pulse: false,
  },
  scanning: {
    label: 'SCANNING',
    className: 'bg-accent/20 text-accent border border-accent/30',
    pulse: false,
  },
  spraying: {
    label: 'SPRAYING',
    className: 'bg-secondary/20 text-secondary border border-secondary/30',
    pulse: true,
  },
  alert: {
    label: 'ALERT',
    className: 'bg-destructive/20 text-destructive border border-destructive/30',
    pulse: true,
  },
  returning: {
    label: 'RETURNING',
    className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    pulse: false,
  },
};

export function StatusChip({ mode, className }: StatusChipProps) {
  const config = modeConfig[mode];

  return (
    <motion.div
      className={cn(
        'status-chip',
        config.className,
        className
      )}
      animate={config.pulse ? {
        boxShadow: [
          '0 0 0 0 currentColor',
          '0 0 0 4px transparent',
        ],
      } : {}}
      transition={config.pulse ? {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      } : {}}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-current"
        animate={config.pulse ? { scale: [1, 1.2, 1] } : {}}
        transition={config.pulse ? { duration: 1, repeat: Infinity } : {}}
      />
      {config.label}
    </motion.div>
  );
}
