-- ========================================
-- FIX VOOR CHAT DATABASE SCHEMA
-- ========================================
-- Voer dit uit in Supabase Dashboard > SQL Editor
-- Dit zorgt ervoor dat de direct_messages tabel correct is geconfigureerd

-- STAP 1: Drop oude policies (om conflicten te voorkomen)
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.direct_messages;

-- STAP 2: Check of tabel bestaat met oude kolommen (sender_id/receiver_id)
-- Als deze bestaat, droppen we deze en maken een nieuwe aan
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'direct_messages' 
    AND column_name IN ('sender_id', 'receiver_id')
  ) THEN
    -- Backup oude data indien nodig
    -- CREATE TABLE direct_messages_backup AS SELECT * FROM direct_messages;
    
    DROP TABLE IF EXISTS public.direct_messages CASCADE;
    RAISE NOTICE 'Oude direct_messages tabel verwijderd (had sender_id/receiver_id kolommen)';
  END IF;
END $$;

-- STAP 3: Maak de correcte direct_messages tabel aan
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  original_language TEXT DEFAULT 'nl',
  translated_content JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_read BOOLEAN DEFAULT false
);

-- STAP 4: Voeg indexes toe voor performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_from_user ON public.direct_messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_to_user ON public.direct_messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_from_user_created ON public.direct_messages(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_to_user_created ON public.direct_messages(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON public.direct_messages(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- STAP 5: Enable Row Level Security
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- STAP 6: Maak nieuwe RLS policies
-- Policy voor SELECT: gebruikers kunnen berichten zien die ze verzonden of ontvangen hebben
CREATE POLICY "Users can view messages they sent or received" 
ON public.direct_messages 
FOR SELECT 
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Policy voor INSERT: gebruikers kunnen alleen berichten verzenden als hun eigen user_id
CREATE POLICY "Users can send messages" 
ON public.direct_messages 
FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

-- Policy voor UPDATE: gebruikers kunnen hun eigen verzonden berichten updaten
CREATE POLICY "Users can update their own messages" 
ON public.direct_messages 
FOR UPDATE 
USING (auth.uid() = from_user_id);

-- Policy voor UPDATE (ontvangen berichten): gebruikers kunnen ontvangen berichten markeren als gelezen
CREATE POLICY "Users can mark received messages as read" 
ON public.direct_messages 
FOR UPDATE 
USING (auth.uid() = to_user_id);

-- STAP 7: Enable realtime
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- STAP 8: Add to realtime publication (als deze al bestaat)
DO $$
BEGIN
  -- Check if publication exists and add table if not already added
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Try to add table to publication (will fail silently if already added)
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Table already in publication';
    END;
  END IF;
END $$;

-- STAP 9: Maak updated_at trigger functie aan (als deze niet bestaat)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STAP 10: Voeg trigger toe voor updated_at
DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- STAP 11: Test de setup met een dummy query
SELECT 
  'direct_messages' as table_name,
  COUNT(*) as message_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'direct_messages') as policy_count,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'direct_messages') as rls_enabled
FROM public.direct_messages;

-- ========================================
-- RESULTAAT:
-- ✅ direct_messages tabel met juiste kolommen
-- ✅ from_user_id en to_user_id foreign keys
-- ✅ RLS policies voor select, insert, update
-- ✅ Indexes voor performance
-- ✅ Realtime enabled
-- ✅ Updated_at trigger
-- ========================================

-- VERIFICATIE QUERIES (uncomment om te testen):
-- 1. Check kolommen
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'direct_messages' ORDER BY ordinal_position;

-- 2. Check policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'direct_messages';

-- 3. Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'direct_messages';

