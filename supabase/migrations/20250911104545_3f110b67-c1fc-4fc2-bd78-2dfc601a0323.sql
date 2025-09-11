-- Enable realtime for direct_messages table
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Add direct_messages to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_from_user_created ON public.direct_messages(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_to_user_created ON public.direct_messages(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON public.direct_messages(from_user_id, to_user_id);

-- Ensure RLS policies exist for direct_messages
DO $$
BEGIN
    -- Check if policies exist before creating them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'direct_messages' 
        AND policyname = 'Users can view messages they sent or received'
    ) THEN
        CREATE POLICY "Users can view messages they sent or received" ON public.direct_messages
            FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'direct_messages' 
        AND policyname = 'Users can send messages'
    ) THEN
        CREATE POLICY "Users can send messages" ON public.direct_messages
            FOR INSERT WITH CHECK (auth.uid() = from_user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'direct_messages' 
        AND policyname = 'Users can update their own messages'
    ) THEN
        CREATE POLICY "Users can update their own messages" ON public.direct_messages
            FOR UPDATE USING (auth.uid() = from_user_id);
    END IF;
END
$$;