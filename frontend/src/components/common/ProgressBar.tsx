import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'battery' | 'tank' | 'health' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const variantStyles = {
  default: 'bg-primary',
  battery: 'bg-gradient-to-r from-primary to-emerald-400',
  tank: 'bg-gradient-to-r from-secondary to-amber-400',
  health: 'bg-gradient-to-r from-health-excellent to-health-good',
  danger: 'bg-gradient-to-r from-destructive to-red-400',
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({ 
  value, 
  max = 100, 
  variant = 'default',
  size = 'md',
  showLabel = false,
  className 
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  // Determine if we should show danger state
  const isDanger = percentage < 20;
  const finalVariant = isDanger && variant !== 'danger' ? 'danger' : variant;

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('progress-bar', sizeStyles[size])}>
        <motion.div
          className={cn(
            'progress-bar-fill',
            variantStyles[finalVariant],
            sizeStyles[size]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <motion.span 
          className="text-xs text-muted-foreground mt-1 block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Math.round(percentage)}%
        </motion.span>
      )}
    </div>
  );
}
