-- =====================================================
-- DEVICE TOKENS TABLE
-- Purpose: Store FCM device tokens for push notifications
-- Created: 2025-01-10
-- =====================================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  
  -- Device info (optional)
  device_name VARCHAR(255),
  device_model VARCHAR(255),
  os_version VARCHAR(50),
  app_version VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one token per user+token combination
  UNIQUE(user_id, token)
);

-- Indexes
CREATE INDEX idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX idx_device_tokens_platform ON public.device_tokens(platform);
CREATE INDEX idx_device_tokens_active ON public.device_tokens(is_active);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own device tokens"
ON public.device_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own device tokens"
ON public.device_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens"
ON public.device_tokens
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device tokens"
ON public.device_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Service role can manage all tokens
CREATE POLICY "Service role can manage all device tokens"
ON public.device_tokens
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.device_tokens IS 'Stores FCM device tokens for push notifications';
COMMENT ON COLUMN public.device_tokens.token IS 'FCM registration token';
COMMENT ON COLUMN public.device_tokens.platform IS 'Device platform: ios, android, or web';
COMMENT ON COLUMN public.device_tokens.is_active IS 'Whether token is still valid and active';

