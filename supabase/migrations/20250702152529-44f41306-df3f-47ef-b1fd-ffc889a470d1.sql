-- Create chat channels table
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general', -- 'general', 'project', 'direct'
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file', 'voice'
  file_url TEXT,
  file_name TEXT,
  translated_content JSONB, -- Store translations by language code
  reply_to_id UUID REFERENCES public.chat_messages(id),
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat participants table
CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(channel_id, user_id)
);

-- Create user notifications table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  reference_type TEXT, -- 'project', 'chat', 'quote', etc.
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  chat_notifications BOOLEAN NOT NULL DEFAULT true,
  project_notifications BOOLEAN NOT NULL DEFAULT true,
  quote_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_channels
CREATE POLICY "Users can view channels they participate in" 
ON public.chat_channels 
FOR SELECT 
USING (
  id IN (
    SELECT channel_id FROM public.chat_participants 
    WHERE user_id = auth.uid()
  ) OR created_by = auth.uid()
);

CREATE POLICY "Authenticated users can create channels" 
ON public.chat_channels 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel creators can update channels" 
ON public.chat_channels 
FOR UPDATE 
USING (created_by = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their channels" 
ON public.chat_messages 
FOR SELECT 
USING (
  channel_id IN (
    SELECT channel_id FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their channels" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  channel_id IN (
    SELECT channel_id FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.chat_messages 
FOR UPDATE 
USING (sender_id = auth.uid());

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants in their channels" 
ON public.chat_participants 
FOR SELECT 
USING (
  channel_id IN (
    SELECT channel_id FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join channels" 
ON public.chat_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participation" 
ON public.chat_participants 
FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications" 
ON public.user_notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.user_notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications for users" 
ON public.user_notifications 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own preferences" 
ON public.notification_preferences 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications(is_read);

-- Create triggers for updated_at
CREATE TRIGGER update_chat_channels_updated_at
BEFORE UPDATE ON public.chat_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_channels REPLICA IDENTITY FULL;
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;