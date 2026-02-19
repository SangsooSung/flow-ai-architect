-- Create projects table for Flow AI Architect
-- This table stores all project data including phase completions

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  current_phase INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  phase1_data JSONB,
  phase2_data JSONB,
  phase3_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now - in production you'd restrict by user)
-- This allows anonymous access which matches your current anon key setup
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON projects TO anon;
GRANT ALL ON projects TO authenticated;
