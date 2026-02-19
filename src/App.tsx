import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProjectContext } from "@/contexts/ProjectContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useProjects } from "@/hooks/useProjects";
import Dashboard from "@/pages/Dashboard";
import NewProject from "@/pages/NewProject";
import ProjectDetail from "@/pages/ProjectDetail";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const projectStore = useProjects();

  return (
    <ProjectContext.Provider value={projectStore}>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/new" element={<NewProject mode="new" />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/project/:id/edit" element={<NewProject mode="resume" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </ProjectContext.Provider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;