-- Phase 1: Add user_id to projects for auth scoping
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Update RLS policies to scope by user
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Zoom connections (user-level Zoom OAuth tokens)
CREATE TABLE IF NOT EXISTS zoom_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  zoom_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, zoom_account_id)
);

ALTER TABLE zoom_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own zoom connections" ON zoom_connections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_zoom_connections_updated_at
  BEFORE UPDATE ON zoom_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Zoom meetings
CREATE TABLE IF NOT EXISTS zoom_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  zoom_meeting_id TEXT NOT NULL,
  meeting_url TEXT,
  topic TEXT,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','bot_joining','in_progress','processing','completed','failed')),
  bot_task_arn TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zoom_meetings_user_id ON zoom_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_status ON zoom_meetings(status);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_zoom_meeting_id ON zoom_meetings(zoom_meeting_id);

ALTER TABLE zoom_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own zoom meetings" ON zoom_meetings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_zoom_meetings_updated_at
  BEFORE UPDATE ON zoom_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Transcripts
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES zoom_meetings(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  speaker_segments JSONB,
  word_count INTEGER,
  duration_seconds INTEGER,
  source TEXT DEFAULT 'zoom_recording'
    CHECK (source IN ('zoom_recording','live_bot','manual_upload')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transcripts" ON transcripts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Calendar connections (Phase 3: Google Calendar)
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  calendar_sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own calendar connections" ON calendar_connections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification preferences (Phase 4)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  email_on_transcript_ready BOOLEAN DEFAULT true,
  email_on_phase1_complete BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON zoom_connections TO authenticated;
GRANT ALL ON zoom_meetings TO authenticated;
GRANT ALL ON transcripts TO authenticated;
GRANT ALL ON calendar_connections TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;

-- Enable realtime for zoom_meetings and transcripts
ALTER PUBLICATION supabase_realtime ADD TABLE zoom_meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE transcripts;
