-- Create changelogs table
CREATE TABLE IF NOT EXISTS changelogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  repo_id BIGINT NOT NULL,
  repo_name TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  commit_count INTEGER NOT NULL DEFAULT 0,
  raw_data JSONB NOT NULL,
  processed_changelog TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_changelogs_user_id ON changelogs(user_id);
CREATE INDEX IF NOT EXISTS idx_changelogs_repo_id ON changelogs(repo_id);
CREATE INDEX IF NOT EXISTS idx_changelogs_status ON changelogs(status);

-- Enable Row Level Security
ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own changelogs
CREATE POLICY "Users can view their own changelogs" 
  ON changelogs FOR SELECT 
  USING (user_id = auth.uid()::text);

-- Create policy to allow users to insert their own changelogs
CREATE POLICY "Users can insert their own changelogs" 
  ON changelogs FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text); 