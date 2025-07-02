-- Fase 6, Stap 3: Mobile App Chat Integration Optimalisatie
-- Database schema extensions for enhanced chat functionality

-- Add message delivery status and read receipts
ALTER TABLE public.chat_messages 
ADD COLUMN delivery_status TEXT DEFAULT 'sent',
ADD COLUMN read_by JSONB DEFAULT '{}';

-- Create typing indicators table
CREATE TABLE public.chat_typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add user online status to profiles
ALTER TABLE public.profiles 
ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN is_online BOOLEAN DEFAULT false;

-- Create message reactions table
CREATE TABLE public.chat_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create offline message queue table
CREATE TABLE public.offline_message_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  temp_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE,
  is_synced BOOLEAN DEFAULT false
);

-- Enable RLS on new tables
ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_message_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing indicators
CREATE POLICY "Users can manage typing indicators in their channels" 
ON public.chat_typing_indicators 
FOR ALL 
USING (channel_id IN (
  SELECT channel_id FROM chat_participants WHERE user_id = auth.uid()
));

-- RLS policies for message reactions
CREATE POLICY "Users can view reactions in their channels" 
ON public.chat_message_reactions 
FOR SELECT 
USING (message_id IN (
  SELECT cm.id FROM chat_messages cm 
  WHERE cm.channel_id IN (
    SELECT channel_id FROM chat_participants WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can manage their own reactions" 
ON public.chat_message_reactions 
FOR ALL 
USING (user_id = auth.uid());

-- RLS policies for offline queue
CREATE POLICY "Users can manage their own offline queue" 
ON public.offline_message_queue 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_chat_typing_indicators_channel_user ON chat_typing_indicators(channel_id, user_id);
CREATE INDEX idx_chat_message_reactions_message ON chat_message_reactions(message_id);
CREATE INDEX idx_offline_queue_user_sync ON offline_message_queue(user_id, is_synced);
CREATE INDEX idx_profiles_online_status ON profiles(is_online, last_seen);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_chat_typing_indicators_updated_at
BEFORE UPDATE ON public.chat_typing_indicators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION public.cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.chat_typing_indicators 
  WHERE updated_at < now() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Function to update user online status
CREATE OR REPLACE FUNCTION public.update_user_online_status(p_user_id UUID, p_is_online BOOLEAN)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    is_online = p_is_online,
    last_seen = CASE WHEN p_is_online THEN now() ELSE last_seen END,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;