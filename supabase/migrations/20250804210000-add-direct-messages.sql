-- Create direct_messages table for person-to-person chat
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'voice', 'location')),
  file_url TEXT,
  file_name VARCHAR(255),
  file_size BIGINT,
  file_type VARCHAR(100),
  thumbnail_url TEXT,
  audio_duration INTEGER, -- in seconds
  transcription_text TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  detected_language VARCHAR(10),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_unread ON direct_messages(receiver_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see messages they sent or received
CREATE POLICY "Users can view their own messages" ON direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" ON direct_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Service role can manage all messages (for admin purposes)
CREATE POLICY "Service role can manage all messages" ON direct_messages
  FOR ALL USING (auth.role() = 'service_role');

-- Admins can view all messages for moderation
CREATE POLICY "Admins can view all messages" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Administrator'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_direct_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_direct_messages_updated_at
  BEFORE UPDATE ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_messages_updated_at();

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM direct_messages
    WHERE receiver_id = user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation list for a user
CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_user_name TEXT,
  other_user_email TEXT,
  other_user_role TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_messages AS (
    SELECT 
      CASE 
        WHEN dm.sender_id = user_id THEN dm.receiver_id 
        ELSE dm.sender_id 
      END as other_user_id,
      dm.content as last_message,
      dm.created_at as last_message_at,
      ROW_NUMBER() OVER (
        PARTITION BY CASE 
          WHEN dm.sender_id = user_id THEN dm.receiver_id 
          ELSE dm.sender_id 
        END 
        ORDER BY dm.created_at DESC
      ) as rn
    FROM direct_messages dm
    WHERE dm.sender_id = user_id OR dm.receiver_id = user_id
  ),
  latest_messages AS (
    SELECT * FROM conversation_messages WHERE rn = 1
  ),
  unread_counts AS (
    SELECT 
      dm.sender_id as other_user_id,
      COUNT(*) as unread_count
    FROM direct_messages dm
    WHERE dm.receiver_id = user_id AND dm.is_read = false
    GROUP BY dm.sender_id
  )
  SELECT 
    lm.other_user_id,
    p.full_name as other_user_name,
    p.email as other_user_email,
    p.role as other_user_role,
    lm.last_message,
    lm.last_message_at,
    COALESCE(uc.unread_count, 0) as unread_count
  FROM latest_messages lm
  LEFT JOIN profiles p ON p.id = lm.other_user_id
  LEFT JOIN unread_counts uc ON uc.other_user_id = lm.other_user_id
  ORDER BY lm.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON direct_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;