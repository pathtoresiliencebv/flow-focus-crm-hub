-- Error logging and monitoring system
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_id VARCHAR(255) NOT NULL UNIQUE,
  message TEXT NOT NULL,
  stack_trace TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'unknown',
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  component VARCHAR(255),
  action VARCHAR(255),
  additional_data JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Performance monitoring table
CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  page_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  duration_ms INTEGER NOT NULL,
  memory_usage_mb DECIMAL(10,2),
  device_info JSONB DEFAULT '{}'::jsonb,
  network_info JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- User feedback and bug reports
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'feedback', -- 'feedback', 'bug', 'feature_request'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  related_error_id VARCHAR(255),
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_unit VARCHAR(20),
  category VARCHAR(50) NOT NULL, -- 'database', 'api', 'sync', 'mobile', 'payment'
  tags JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component);

CREATE INDEX IF NOT EXISTS idx_performance_logs_user_id ON performance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_page_name ON performance_logs(page_name);
CREATE INDEX IF NOT EXISTS idx_performance_logs_timestamp ON performance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_duration ON performance_logs(duration_ms);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_timestamp ON user_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_metrics_category ON system_health_metrics(category);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_metric_name ON system_health_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_timestamp ON system_health_metrics(timestamp DESC);

-- Full text search for error messages
CREATE INDEX IF NOT EXISTS idx_error_logs_message_search ON error_logs USING gin(to_tsvector('english', message));
CREATE INDEX IF NOT EXISTS idx_user_feedback_search ON user_feedback USING gin(to_tsvector('english', title || ' ' || description));

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_logs
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all error logs" ON error_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- RLS Policies for performance_logs
CREATE POLICY "Users can view their own performance logs" ON performance_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all performance logs" ON performance_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can insert performance logs" ON performance_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- RLS Policies for user_feedback
CREATE POLICY "Users can manage their own feedback" ON user_feedback
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON user_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Administrator', 'Administratie')
    )
  );

CREATE POLICY "Service role can manage all feedback" ON user_feedback
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for system_health_metrics
CREATE POLICY "Admins can view system metrics" ON system_health_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Administrator'
    )
  );

CREATE POLICY "Service role can manage all system metrics" ON system_health_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for error analysis
CREATE OR REPLACE FUNCTION get_error_summary(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
  category VARCHAR(50),
  severity VARCHAR(20),
  error_count BIGINT,
  unique_users BIGINT,
  latest_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.category,
    el.severity,
    COUNT(*) as error_count,
    COUNT(DISTINCT el.user_id) as unique_users,
    MAX(el.timestamp) as latest_occurrence
  FROM error_logs el
  WHERE el.timestamp >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY el.category, el.severity
  ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance metrics
CREATE OR REPLACE FUNCTION get_performance_summary(days_back INTEGER DEFAULT 7)
RETURNS TABLE(
  page_name VARCHAR(255),
  action VARCHAR(255),
  avg_duration_ms DECIMAL(10,2),
  max_duration_ms INTEGER,
  request_count BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.page_name,
    pl.action,
    AVG(pl.duration_ms)::DECIMAL(10,2) as avg_duration_ms,
    MAX(pl.duration_ms) as max_duration_ms,
    COUNT(*) as request_count,
    COUNT(DISTINCT pl.user_id) as unique_users
  FROM performance_logs pl
  WHERE pl.timestamp >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY pl.page_name, pl.action
  ORDER BY avg_duration_ms DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect error patterns
CREATE OR REPLACE FUNCTION detect_error_patterns(hours_back INTEGER DEFAULT 24)
RETURNS TABLE(
  pattern_type TEXT,
  pattern_value TEXT,
  error_count BIGINT,
  affected_users BIGINT,
  first_occurrence TIMESTAMPTZ,
  last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  -- Pattern by error message similarity
  RETURN QUERY
  SELECT 
    'similar_message'::TEXT as pattern_type,
    SUBSTRING(el.message FROM 1 FOR 100) as pattern_value,
    COUNT(*) as error_count,
    COUNT(DISTINCT el.user_id) as affected_users,
    MIN(el.timestamp) as first_occurrence,
    MAX(el.timestamp) as last_occurrence
  FROM error_logs el
  WHERE el.timestamp >= NOW() - INTERVAL '1 hour' * hours_back
  GROUP BY SUBSTRING(el.message FROM 1 FOR 100)
  HAVING COUNT(*) > 5
  
  UNION ALL
  
  -- Pattern by component + action
  SELECT 
    'component_action'::TEXT as pattern_type,
    el.component || '::' || el.action as pattern_value,
    COUNT(*) as error_count,
    COUNT(DISTINCT el.user_id) as affected_users,
    MIN(el.timestamp) as first_occurrence,
    MAX(el.timestamp) as last_occurrence
  FROM error_logs el
  WHERE el.timestamp >= NOW() - INTERVAL '1 hour' * hours_back
    AND el.component IS NOT NULL 
    AND el.action IS NOT NULL
  GROUP BY el.component, el.action
  HAVING COUNT(*) > 3
  
  ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old logs (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete error logs older than 90 days
  DELETE FROM error_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete performance logs older than 30 days
  DELETE FROM performance_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  -- Delete system health metrics older than 60 days
  DELETE FROM system_health_metrics 
  WHERE timestamp < NOW() - INTERVAL '60 days';
  
  -- Keep resolved feedback for 1 year, unresolved forever
  DELETE FROM user_feedback 
  WHERE resolved_at IS NOT NULL 
    AND resolved_at < NOW() - INTERVAL '1 year';
  
  RETURN deleted_count;
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

CREATE TRIGGER update_user_feedback_updated_at 
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();