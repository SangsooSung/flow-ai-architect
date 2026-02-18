import { useState, useCallback } from "react";
import type { Project, Phase1Data, Phase2Data, Phase3Data } from "@/types/project";
import { mockProjects } from "@/data/mockData";

const STORAGE_KEY = "flow-ai-projects";

function loadProjects(): Project[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return mockProjects;
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(loadProjects);

  const updateProjects = useCallback((updater: (prev: Project[]) => Project[]) => {
    setProjects((prev) => {
      const next = updater(prev);
      saveProjects(next);
      return next;
    });
  }, []);

  const createProject = useCallback((name: string, clientName: string): Project => {
    const project: Project = {
      id: `proj-${Date.now()}`,
      name,
      clientName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentPhase: 1,
      status: "draft",
      phase1: null,
      phase2: null,
      phase3: null,
    };
    updateProjects((prev) => [project, ...prev]);
    return project;
  }, [updateProjects]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    updateProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    );
  }, [updateProjects]);

  const updatePhase1 = useCallback((id: string, data: Phase1Data) => {
    updateProject(id, { phase1: data, currentPhase: 2, status: "in_progress" });
  }, [updateProject]);

  const updatePhase2 = useCallback((id: string, data: Phase2Data) => {
    updateProject(id, { phase2: data, currentPhase: 3 });
  }, [updateProject]);

  const updatePhase3 = useCallback((id: string, data: Phase3Data) => {
    updateProject(id, { phase3: data, status: "completed" });
  }, [updateProject]);

  const getProject = useCallback((id: string) => {
    return projects.find((p) => p.id === id) ?? null;
  }, [projects]);

  const deleteProject = useCallback((id: string) => {
    updateProjects((prev) => prev.filter((p) => p.id !== id));
  }, [updateProjects]);

  return {
    projects,
    createProject,
    updateProject,
    updatePhase1,
    updatePhase2,
    updatePhase3,
    getProject,
    deleteProject,
  };
}
