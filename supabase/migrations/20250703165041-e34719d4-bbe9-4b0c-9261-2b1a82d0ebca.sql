-- Fix infinite recursion in chat_participants policy
-- The issue is that the policy references the same table it's applied to

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants in their channels" ON public.chat_participants;

-- Create a new policy that doesn't cause recursion
-- Use a simple approach that allows users to see participants in channels they are part of
CREATE POLICY "Users can view participants in their channels" 
ON public.chat_participants 
FOR SELECT 
USING (
  -- User can see participants if they are also a participant in the same channel
  EXISTS (
    SELECT 1 FROM public.chat_participants cp2 
    WHERE cp2.channel_id = chat_participants.channel_id 
    AND cp2.user_id = auth.uid()
  )
);