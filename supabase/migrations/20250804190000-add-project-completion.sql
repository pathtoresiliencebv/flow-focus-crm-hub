-- Project completion workflow tables

-- Project completions table
CREATE TABLE IF NOT EXISTS project_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  installer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  work_performed TEXT NOT NULL,
  materials_used TEXT,
  recommendations TEXT,
  notes TEXT,
  customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5) DEFAULT 5,
  customer_signature TEXT NOT NULL,
  installer_signature TEXT NOT NULL,
  pdf_url TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'completed', 'sent'
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completion photos table
CREATE TABLE IF NOT EXISTS completion_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  completion_id UUID REFERENCES project_completions(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'after', -- 'before', 'during', 'after', 'detail', 'overview'
  file_name VARCHAR(255),
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add completion tracking to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS completion_id UUID REFERENCES project_completions(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_completions_project_id ON project_completions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_completions_installer_id ON project_completions(installer_id);
CREATE INDEX IF NOT EXISTS idx_project_completions_completion_date ON project_completions(completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_completions_status ON project_completions(status);
CREATE INDEX IF NOT EXISTS idx_completion_photos_completion_id ON completion_photos(completion_id);
CREATE INDEX IF NOT EXISTS idx_completion_photos_category ON completion_photos(category);

-- Enable RLS
ALTER TABLE project_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE completion_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_completions
CREATE POLICY "Users can view completions for their projects" ON project_completions
  FOR SELECT USING (
    -- Project team members can view
    EXISTS (
      SELECT 1 FROM project_team_members ptm
      WHERE ptm.project_id = project_completions.project_id
      AND ptm.user_id = auth.uid()
    )
    OR
    -- Installers can view their own completions
    installer_id = auth.uid()
    OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Administrator', 'Administratie')
    )
  );

CREATE POLICY "Installers can create completions for assigned projects" ON project_completions
  FOR INSERT WITH CHECK (
    installer_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM project_team_members ptm
      WHERE ptm.project_id = project_completions.project_id
      AND ptm.user_id = auth.uid()
      AND ptm.role = 'Monteur'
    )
  );

CREATE POLICY "Installers can update their own completions" ON project_completions
  FOR UPDATE USING (
    installer_id = auth.uid()
    AND status = 'draft'
  );

CREATE POLICY "Admins can manage all completions" ON project_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Administrator', 'Administratie')
    )
  );

-- RLS Policies for completion_photos
CREATE POLICY "Users can view photos for accessible completions" ON completion_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_completions pc
      WHERE pc.id = completion_photos.completion_id
      AND (
        -- Project team members
        EXISTS (
          SELECT 1 FROM project_team_members ptm
          WHERE ptm.project_id = pc.project_id
          AND ptm.user_id = auth.uid()
        )
        OR
        -- Installer who created the completion
        pc.installer_id = auth.uid()
        OR
        -- Admins
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('Administrator', 'Administratie')
        )
      )
    )
  );

CREATE POLICY "Users can manage photos for their completions" ON completion_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_completions pc
      WHERE pc.id = completion_photos.completion_id
      AND (
        pc.installer_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.role IN ('Administrator', 'Administratie')
        )
      )
    )
  );

-- Function to get completion statistics
CREATE OR REPLACE FUNCTION get_completion_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_completions BIGINT,
  avg_satisfaction DECIMAL(3,2),
  completions_by_installer JSONB,
  completions_by_month JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_completions,
    AVG(customer_satisfaction)::DECIMAL(3,2) as avg_satisfaction,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'installer_name', p.full_name,
        'installer_id', pc.installer_id,
        'count', installer_counts.completion_count
      )
    ) as completions_by_installer,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'month', month_counts.month,
        'count', month_counts.completion_count
      )
    ) as completions_by_month
  FROM project_completions pc
  JOIN profiles p ON pc.installer_id = p.id
  LEFT JOIN (
    SELECT 
      installer_id,
      COUNT(*) as completion_count
    FROM project_completions
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY installer_id
  ) installer_counts ON pc.installer_id = installer_counts.installer_id
  LEFT JOIN (
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      COUNT(*) as completion_count
    FROM project_completions  
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY DATE_TRUNC('month', created_at)
  ) month_counts ON DATE_TRUNC('month', pc.created_at) = month_counts.month
  WHERE pc.created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark project as completed
CREATE OR REPLACE FUNCTION complete_project(
  p_project_id UUID,
  p_completion_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update project status and link completion
  UPDATE projects 
  SET 
    status = 'Afgerond',
    completion_date = CURRENT_DATE,
    completion_id = p_completion_id,
    updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Update completion status
  UPDATE project_completions
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = p_completion_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_completions_updated_at 
  BEFORE UPDATE ON project_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for completion reports (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('completion-reports', 'completion-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for completion reports
CREATE POLICY "Authenticated users can view completion reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'completion-reports' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Installers can upload completion reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'completion-reports' 
    AND auth.uid() IS NOT NULL
  );

-- Initial data - completion photo categories
INSERT INTO completion_photos (id, completion_id, photo_url, description, category) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '', 'Example photo categories', 'before'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '', 'Work in progress photos', 'during'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '', 'Finished work photos', 'after'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '', 'Detail shots of specific work', 'detail'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', '', 'Overall view of completed work', 'overview')
ON CONFLICT DO NOTHING;

-- Delete example records
DELETE FROM completion_photos WHERE completion_id = '00000000-0000-0000-0000-000000000000';