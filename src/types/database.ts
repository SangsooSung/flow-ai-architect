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
          user_id: string | null;
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
          user_id?: string | null;
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
          user_id?: string | null;
          phase1_data?: Phase1Data | null;
          phase2_data?: Phase2Data | null;
          phase3_data?: Phase3Data | null;
          phase4_data?: Phase4Data | null;
          updated_at?: string;
        };
      };
      zoom_connections: {
        Row: {
          id: string;
          user_id: string;
          zoom_account_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          zoom_account_id: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          zoom_account_id?: string;
          access_token?: string;
          refresh_token?: string;
          token_expires_at?: string;
          updated_at?: string;
        };
      };
      zoom_meetings: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          zoom_meeting_id: string;
          meeting_url: string | null;
          topic: string | null;
          status: ZoomMeetingStatus;
          bot_task_arn: string | null;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          zoom_meeting_id: string;
          meeting_url?: string | null;
          topic?: string | null;
          status?: ZoomMeetingStatus;
          bot_task_arn?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string | null;
          zoom_meeting_id?: string;
          meeting_url?: string | null;
          topic?: string | null;
          status?: ZoomMeetingStatus;
          bot_task_arn?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          updated_at?: string;
        };
      };
      transcripts: {
        Row: {
          id: string;
          meeting_id: string;
          user_id: string;
          content: string;
          speaker_segments: Json | null;
          word_count: number | null;
          duration_seconds: number | null;
          source: TranscriptSource;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          user_id: string;
          content: string;
          speaker_segments?: Json | null;
          word_count?: number | null;
          duration_seconds?: number | null;
          source?: TranscriptSource;
          created_at?: string;
        };
        Update: {
          content?: string;
          speaker_segments?: Json | null;
          word_count?: number | null;
          duration_seconds?: number | null;
          source?: TranscriptSource;
        };
      };
      calendar_connections: {
        Row: {
          id: string;
          user_id: string;
          provider: 'google' | 'microsoft';
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          calendar_sync_enabled: boolean;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: 'google' | 'microsoft';
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          calendar_sync_enabled?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Update: {
          access_token?: string;
          refresh_token?: string;
          token_expires_at?: string;
          calendar_sync_enabled?: boolean;
          last_synced_at?: string | null;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_on_transcript_ready: boolean;
          email_on_phase1_complete: boolean;
          in_app_notifications: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_on_transcript_ready?: boolean;
          email_on_phase1_complete?: boolean;
          in_app_notifications?: boolean;
          created_at?: string;
        };
        Update: {
          email_on_transcript_ready?: boolean;
          email_on_phase1_complete?: boolean;
          in_app_notifications?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Enum types
export type ZoomMeetingStatus = 'scheduled' | 'bot_joining' | 'in_progress' | 'processing' | 'completed' | 'failed';
export type TranscriptSource = 'zoom_recording' | 'live_bot' | 'manual_upload';

// Helper types for projects
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// Helper types for zoom
export type ZoomConnectionRow = Database['public']['Tables']['zoom_connections']['Row'];
export type ZoomMeetingRow = Database['public']['Tables']['zoom_meetings']['Row'];
export type TranscriptRow = Database['public']['Tables']['transcripts']['Row'];
export type CalendarConnectionRow = Database['public']['Tables']['calendar_connections']['Row'];
export type NotificationPreferencesRow = Database['public']['Tables']['notification_preferences']['Row'];
