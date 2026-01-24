import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Overview from "./pages/Overview";
import LiveVision from "./pages/LiveVision";
import PlantHealth from "./pages/PlantHealth";
import Alerts from "./pages/Alerts";
import Missions from "./pages/Missions";
import HistorySystem from "./pages/HistorySystem";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/vision" element={<LiveVision />} />
            <Route path="/health" element={<PlantHealth />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/history" element={<HistorySystem />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
