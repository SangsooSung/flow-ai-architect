-- Add Phase 4 support to projects table
-- Migration: Add phase4_data JSONB column for implementation prompt storage

-- Add Phase 4 data column
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS phase4_data JSONB;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_projects_phase4_data
ON projects USING GIN (phase4_data);

-- Add comment for documentation
COMMENT ON COLUMN projects.phase4_data IS 'Phase 4: AI implementation prompts with tech stack config, prompt collection, and metadata';
