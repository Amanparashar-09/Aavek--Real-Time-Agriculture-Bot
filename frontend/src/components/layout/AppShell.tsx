import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';
import { startSimulation, stopSimulation } from '@/data/simulator/StreamSimulator';
import { ChatSupport } from '@/components/common/ChatSupport';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useEffect(() => {
    // Start simulation on mount
    startSimulation();
    
    return () => {
      stopSimulation();
    };
  }, []);

  return (
    <div className="min-h-screen ambient-bg flex flex-col">
      
      {/* Top Status Bar */}
      <StatusBar />
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {/* Chat support widget */}
      <ChatSupport />
    </div>
  );
}
