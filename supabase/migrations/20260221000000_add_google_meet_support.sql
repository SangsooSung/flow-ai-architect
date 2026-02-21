-- Add Google Meet support to zoom_meetings table
-- Adds platform column, google_meet_code, makes zoom_meeting_id nullable,
-- and updates transcript source constraint to include google_meet_bot.

-- Add platform column to zoom_meetings (default 'zoom' for existing rows)
ALTER TABLE zoom_meetings ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'zoom'
  CHECK (platform IN ('zoom', 'google_meet'));

-- Make zoom_meeting_id nullable (Google Meet uses a different ID format)
ALTER TABLE zoom_meetings ALTER COLUMN zoom_meeting_id DROP NOT NULL;

-- Add google_meet_code column for meet.google.com/xxx-yyyy-zzz codes
ALTER TABLE zoom_meetings ADD COLUMN IF NOT EXISTS google_meet_code TEXT;

-- Update transcript source enum to include google_meet_bot
ALTER TABLE transcripts DROP CONSTRAINT IF EXISTS transcripts_source_check;
ALTER TABLE transcripts ADD CONSTRAINT transcripts_source_check
  CHECK (source IN ('zoom_recording', 'live_bot', 'manual_upload', 'google_meet_bot'));
