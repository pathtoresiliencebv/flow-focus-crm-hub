-- Create user_calendar_settings table
CREATE TABLE IF NOT EXISTS user_calendar_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'google',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  provider_user_id VARCHAR(255),
  provider_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Add calendar sync columns to planning_items
ALTER TABLE planning_items 
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_calendar_settings_user_id ON user_calendar_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_settings_provider ON user_calendar_settings(provider);
CREATE INDEX IF NOT EXISTS idx_planning_items_calendar_event ON planning_items(google_calendar_event_id);

-- Enable RLS
ALTER TABLE user_calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own calendar settings" ON user_calendar_settings
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically sync planning items to calendar
CREATE OR REPLACE FUNCTION sync_planning_to_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for active calendar connections
  IF EXISTS (
    SELECT 1 FROM user_calendar_settings 
    WHERE user_id = NEW.user_id 
    AND provider = 'google' 
    AND is_active = true
  ) THEN
    -- Mark for sync (actual sync will be handled by the application)
    NEW.synced_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic calendar sync
DROP TRIGGER IF EXISTS trigger_sync_planning_to_calendar ON planning_items;
CREATE TRIGGER trigger_sync_planning_to_calendar
  BEFORE INSERT OR UPDATE ON planning_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_planning_to_calendar();

-- Create calendar sync log table
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  planning_item_id UUID REFERENCES planning_items(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'google',
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  external_event_id VARCHAR(255),
  sync_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for sync log
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user_id ON calendar_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_planning_item ON calendar_sync_log(planning_item_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_status ON calendar_sync_log(sync_status);

-- Enable RLS for sync log
ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for sync log
CREATE POLICY "Users can view their own sync logs" ON calendar_sync_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sync logs" ON calendar_sync_log
  FOR ALL USING (auth.role() = 'service_role');