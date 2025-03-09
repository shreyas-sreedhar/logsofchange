-- Drop the table if it exists to recreate it with the proper schema
DROP TABLE IF EXISTS changelogs;

-- Create the changelogs table with all required columns
CREATE TABLE changelogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  repo_id BIGINT NOT NULL,
  repo_name VARCHAR NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  commit_count INTEGER NOT NULL,
  raw_data JSONB NOT NULL,
  processed_changelog TEXT,
  status VARCHAR NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_changelogs_user_id ON changelogs(user_id);
CREATE INDEX idx_changelogs_repo_id ON changelogs(repo_id);
CREATE INDEX idx_changelogs_status ON changelogs(status);

-- Enable row level security
ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to only see their own changelogs
-- Using email-based identification since that's what our app is using
CREATE POLICY changelogs_user_policy ON changelogs
  USING (user_id = current_user)
  WITH CHECK (user_id = current_user); 