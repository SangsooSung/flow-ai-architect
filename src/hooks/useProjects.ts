import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Project, Phase1Data, Phase2Data, Phase3Data, Phase4Data } from '@/types/project';
import type { Database } from '@/types/database';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

// Map database row to Project type (snake_case to camelCase)
function mapRowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentPhase: row.current_phase as 1 | 2 | 3 | 4,
    status: row.status as 'draft' | 'in_progress' | 'completed',
    phase1: row.phase1_data,
    phase2: row.phase2_data,
    phase3: row.phase3_data,
    phase4: row.phase4_data,
  };
}

export function useProjects() {
  const queryClient = useQueryClient();

  // Fetch all projects from Supabase
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(mapRowToProject);
    },
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async ({ name, clientName }: { name: string; clientName: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          client_name: clientName,
          current_phase: 1,
          status: 'draft',
          phase1_data: null,
          phase2_data: null,
          phase3_data: null,
          phase4_data: null,
        })
        .select()
        .single();

      if (error) throw error;
      return mapRowToProject(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      // Map camelCase to snake_case for database
      const dbUpdates: Database['public']['Tables']['projects']['Update'] = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
      if (updates.currentPhase !== undefined) dbUpdates.current_phase = updates.currentPhase;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.phase1 !== undefined) dbUpdates.phase1_data = updates.phase1;
      if (updates.phase2 !== undefined) dbUpdates.phase2_data = updates.phase2;
      if (updates.phase3 !== undefined) dbUpdates.phase3_data = updates.phase3;
      if (updates.phase4 !== undefined) dbUpdates.phase4_data = updates.phase4;

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Helper functions that return promises
  const createProject = async (name: string, clientName: string): Promise<Project> => {
    return createMutation.mutateAsync({ name, clientName });
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    return updateMutation.mutateAsync({ id, updates });
  };

  const updatePhase1 = async (id: string, data: Phase1Data): Promise<void> => {
    return updateProject(id, { phase1: data, currentPhase: 2, status: 'in_progress' });
  };

  const updatePhase2 = async (id: string, data: Phase2Data): Promise<void> => {
    return updateProject(id, { phase2: data, currentPhase: 3 });
  };

  const updatePhase3 = async (id: string, data: Phase3Data): Promise<void> => {
    return updateProject(id, { phase3: data, currentPhase: 4 });
  };

  const updatePhase4 = async (id: string, data: Phase4Data): Promise<void> => {
    return updateProject(id, { phase4: data, status: 'completed' });
  };

  const getProject = (id: string): Project | null => {
    return projects.find((p) => p.id === id) ?? null;
  };

  const deleteProject = async (id: string): Promise<void> => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    updatePhase1,
    updatePhase2,
    updatePhase3,
    updatePhase4,
    getProject,
    deleteProject,
  };
}