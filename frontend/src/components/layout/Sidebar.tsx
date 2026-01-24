import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Eye, 
  Leaf, 
  AlertTriangle, 
  Target, 
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRobotStore } from '@/store/useRobotStore';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/vision', label: 'Live Vision', icon: Eye },
  { path: '/health', label: 'Plant Health', icon: Leaf },
  { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/missions', label: 'Missions & Spray', icon: Target },
  { path: '/history', label: 'History & System', icon: History },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const alerts = useRobotStore((s) => s.alerts);
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;

  return (
    <motion.aside
      className={cn(
        'glass-panel rounded-none border-y-0 border-l-0 h-full flex flex-col',
        collapsed ? 'w-16' : 'w-56'
      )}
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.2 }}
    >
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const hasAlertBadge = item.path === '/alerts' && unacknowledgedAlerts > 0;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group',
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <item.icon className="w-5 h-5" />
                {hasAlertBadge && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    {unacknowledgedAlerts > 9 ? '9+' : unacknowledgedAlerts}
                  </motion.span>
                )}
              </motion.div>
              
              {!collapsed && (
                <motion.span
                  className="text-sm font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {item.label}
                </motion.span>
              )}
              
              {isActive && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5 mx-auto" />
        ) : (
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Collapse</span>
          </div>
        )}
      </button>
    </motion.aside>
  );
}
