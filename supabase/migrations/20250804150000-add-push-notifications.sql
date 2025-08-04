-- Push notifications schema
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL DEFAULT 'unknown', -- 'ios', 'android', 'web'
  device_info JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Notification settings per user
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  project_notifications BOOLEAN DEFAULT true,
  planning_notifications BOOLEAN DEFAULT true,
  invoice_notifications BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification history/log
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  platform VARCHAR(20),
  error_message TEXT,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_platform ON user_push_tokens(platform);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(type);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_delivery_status ON notification_history(delivery_status);

-- Enable RLS
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own push tokens" ON user_push_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification settings" ON user_notification_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification history" ON notification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notifications" ON user_push_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all notification settings" ON user_notification_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all notification history" ON notification_history
  FOR ALL USING (auth.role() = 'service_role');

-- Function to get active push tokens for user
CREATE OR REPLACE FUNCTION get_user_push_tokens(target_user_id UUID)
RETURNS TABLE(token TEXT, platform VARCHAR(20)) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    upt.token,
    upt.platform
  FROM user_push_tokens upt
  JOIN user_notification_settings uns ON upt.user_id = uns.user_id
  WHERE upt.user_id = target_user_id
    AND upt.is_active = true
    AND uns.enabled = true
    AND upt.updated_at > NOW() - INTERVAL '30 days'; -- Only tokens updated in last 30 days
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user should receive notification (quiet hours)
CREATE OR REPLACE FUNCTION should_send_notification(target_user_id UUID, notification_type VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
  settings RECORD;
  current_time TIME;
BEGIN
  -- Get user notification settings
  SELECT * INTO settings
  FROM user_notification_settings 
  WHERE user_id = target_user_id;
  
  -- If no settings found, create default settings and allow notification
  IF NOT FOUND THEN
    INSERT INTO user_notification_settings (user_id) VALUES (target_user_id);
    RETURN true;
  END IF;
  
  -- Check if notifications are disabled
  IF NOT settings.enabled THEN
    RETURN false;
  END IF;
  
  -- Check specific notification type
  CASE notification_type
    WHEN 'chat' THEN
      IF NOT settings.chat_notifications THEN RETURN false; END IF;
    WHEN 'project' THEN
      IF NOT settings.project_notifications THEN RETURN false; END IF;
    WHEN 'planning' THEN
      IF NOT settings.planning_notifications THEN RETURN false; END IF;
    WHEN 'invoice' THEN
      IF NOT settings.invoice_notifications THEN RETURN false; END IF;
  END CASE;
  
  -- Check quiet hours
  IF settings.quiet_hours_enabled THEN
    current_time := CURRENT_TIME;
    
    -- Handle quiet hours that span midnight
    IF settings.quiet_hours_start > settings.quiet_hours_end THEN
      -- e.g., 22:00 to 08:00
      IF current_time >= settings.quiet_hours_start OR current_time <= settings.quiet_hours_end THEN
        RETURN false;
      END IF;
    ELSE
      -- e.g., 13:00 to 14:00
      IF current_time >= settings.quiet_hours_start AND current_time <= settings.quiet_hours_end THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default notification settings for existing users
INSERT INTO user_notification_settings (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_notification_settings)
ON CONFLICT (user_id) DO NOTHING;