import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'primary' | 'alert' | 'accent' | 'none';
  hover?: boolean;
}

export function GlowCard({ 
  children, 
  className, 
  glowColor = 'none',
  hover = true 
}: GlowCardProps) {
  const glowClasses = {
    primary: 'hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]',
    alert: 'hover:shadow-[0_0_30px_-5px_hsl(var(--destructive)/0.3)]',
    accent: 'hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]',
    none: '',
  };

  return (
    <motion.div
      className={cn(
        'glass-panel p-4',
        hover && 'transition-all duration-300',
        hover && glowClasses[glowColor],
        className
      )}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
