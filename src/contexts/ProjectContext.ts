import { createContext, useContext } from "react";
import type { Project, Phase1Data, Phase2Data, Phase3Data } from "@/types/project";

interface ProjectContextType {
  projects: Project[];
  createProject: (name: string, clientName: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updatePhase1: (id: string, data: Phase1Data) => void;
  updatePhase2: (id: string, data: Phase2Data) => void;
  updatePhase3: (id: string, data: Phase3Data) => void;
  getProject: (id: string) => Project | null;
  deleteProject: (id: string) => void;
}

export const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}
