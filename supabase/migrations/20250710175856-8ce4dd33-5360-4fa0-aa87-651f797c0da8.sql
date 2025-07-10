-- Create direct_messages table to replace channel-based chat
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  content text NOT NULL,
  original_language text NOT NULL DEFAULT 'nl',
  translated_content jsonb DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for direct messages
CREATE POLICY "Users can send direct messages" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can view their direct messages" 
ON public.direct_messages 
FOR SELECT 
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can update their direct messages" 
ON public.direct_messages 
FOR UPDATE 
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_direct_messages_from_user ON public.direct_messages(from_user_id);
CREATE INDEX idx_direct_messages_to_user ON public.direct_messages(to_user_id);
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(from_user_id, to_user_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at);

-- Enable realtime for direct messages
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Trigger for updated_at
CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();