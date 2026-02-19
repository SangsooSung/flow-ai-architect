import { createContext, useContext } from "react";
import type { Project, Phase1Data, Phase2Data, Phase3Data, Phase4Data } from "@/types/project";

interface ProjectContextType {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  createProject: (name: string, clientName: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  updatePhase1: (id: string, data: Phase1Data) => Promise<void>;
  updatePhase2: (id: string, data: Phase2Data) => Promise<void>;
  updatePhase3: (id: string, data: Phase3Data) => Promise<void>;
  updatePhase4: (id: string, data: Phase4Data) => Promise<void>;
  getProject: (id: string) => Project | null;
  deleteProject: (id: string) => Promise<void>;
}

export const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}