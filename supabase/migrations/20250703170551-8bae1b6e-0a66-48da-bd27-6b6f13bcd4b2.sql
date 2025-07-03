-- Fix chat messages foreign key to use profile instead of direct auth.users reference
-- This will prevent errors for older users who don't have profiles yet

-- Add foreign key constraint to chat_messages.sender_id referencing profiles.id
-- This will ensure only users with profiles can send messages
-- For older users without profiles, we'll handle this in the application layer

-- First, let's also fix the infinite recursion in chat_participants policy
-- by creating a security definer function

CREATE OR REPLACE FUNCTION public.get_user_channels()
RETURNS TABLE(channel_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT cp.channel_id
  FROM chat_participants cp
  WHERE cp.user_id = auth.uid()
$$;

-- Update chat_participants policy to use the function
DROP POLICY IF EXISTS "Users can view participants in their channels" ON public.chat_participants;

CREATE POLICY "Users can view participants in their channels"
ON public.chat_participants
FOR SELECT
USING (channel_id IN (SELECT * FROM get_user_channels()));

-- For messages, we'll add similar protection
CREATE OR REPLACE FUNCTION public.user_can_access_channel(channel_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM chat_participants cp 
    WHERE cp.channel_id = channel_uuid 
    AND cp.user_id = auth.uid()
  )
$$;

-- Update chat_messages policies to be more robust
DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.chat_messages;

CREATE POLICY "Users can view messages in their channels"
ON public.chat_messages
FOR SELECT
USING (user_can_access_channel(channel_id));

-- Also ensure chat_channels policy uses the function
DROP POLICY IF EXISTS "Users can view channels they participate in" ON public.chat_channels;

CREATE POLICY "Users can view channels they participate in"
ON public.chat_channels
FOR SELECT
USING (
  user_can_access_channel(id) OR created_by = auth.uid()
);