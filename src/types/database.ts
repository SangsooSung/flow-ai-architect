import type { Phase1Data, Phase2Data, Phase3Data, Phase4Data } from './project';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          client_name: string;
          current_phase: number;
          status: string;
          phase1_data: Phase1Data | null;
          phase2_data: Phase2Data | null;
          phase3_data: Phase3Data | null;
          phase4_data: Phase4Data | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          client_name: string;
          current_phase?: number;
          status?: string;
          phase1_data?: Phase1Data | null;
          phase2_data?: Phase2Data | null;
          phase3_data?: Phase3Data | null;
          phase4_data?: Phase4Data | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          client_name?: string;
          current_phase?: number;
          status?: string;
          phase1_data?: Phase1Data | null;
          phase2_data?: Phase2Data | null;
          phase3_data?: Phase3Data | null;
          phase4_data?: Phase4Data | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Helper type for database row
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];