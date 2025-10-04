-- 🔧 DEFINITIVE CHAT FIX
-- Voer dit uit in Supabase SQL Editor om de chat DEFINITIEF te fixen

-- STAP 1: Check huidige tabel structuur
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'direct_messages' 
ORDER BY ordinal_position;

-- Als je 'sender_id' of 'receiver_id' ziet, ga door naar STAP 2
-- Als je 'from_user_id' en 'to_user_id' ziet, skip naar STAP 3

-- STAP 2: Verwijder oude tabel en maak nieuwe aan
DROP TABLE IF EXISTS public.direct_messages CASCADE;

CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  original_language text NOT NULL DEFAULT 'nl',
  translated_content jsonb DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_read boolean DEFAULT false
);

-- STAP 3: Enable Row Level Security
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- STAP 4: Drop oude policies (als ze bestaan)
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Service role can manage all messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.direct_messages;

-- STAP 5: Maak correcte RLS policies
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

-- STAP 6: Maak indexes
DROP INDEX IF EXISTS idx_direct_messages_from_user;
DROP INDEX IF EXISTS idx_direct_messages_to_user;
DROP INDEX IF EXISTS idx_direct_messages_conversation;
DROP INDEX IF EXISTS idx_direct_messages_created_at;
DROP INDEX IF EXISTS idx_direct_messages_sender_id;
DROP INDEX IF EXISTS idx_direct_messages_receiver_id;
DROP INDEX IF EXISTS idx_direct_messages_unread;

CREATE INDEX idx_direct_messages_from_user ON public.direct_messages(from_user_id);
CREATE INDEX idx_direct_messages_to_user ON public.direct_messages(to_user_id);
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(from_user_id, to_user_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX idx_direct_messages_unread ON public.direct_messages(to_user_id, is_read) WHERE is_read = false;

-- STAP 7: Enable realtime
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- STAP 8: Maak/update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STAP 9: Maak trigger
DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- STAP 10: Grant permissions
GRANT ALL ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

-- STAP 11: Update get_available_chat_users function
-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS public.get_available_chat_users(uuid);

CREATE OR REPLACE FUNCTION public.get_available_chat_users(current_user_id uuid)
RETURNS TABLE(id uuid, full_name text, role text, email text, is_online boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT p.role INTO current_user_role FROM profiles p WHERE p.id = current_user_id;
  
  -- Return users based on role permissions
  IF current_user_role = 'Installateur' THEN
    -- Installateurs can only chat with Administrator and Administratie
    RETURN QUERY
    SELECT p.id, p.full_name, p.role, p.email, COALESCE(p.is_online, false) as is_online
    FROM profiles p
    WHERE p.role IN ('Administrator', 'Administratie')
      AND p.id != current_user_id
    ORDER BY p.full_name;
  ELSIF current_user_role IN ('Administrator', 'Administratie') THEN
    -- Admin/Administratie can chat with all Installateurs and other admin users
    RETURN QUERY
    SELECT p.id, p.full_name, p.role, p.email, COALESCE(p.is_online, false) as is_online
    FROM profiles p
    WHERE (p.role = 'Installateur' OR p.role IN ('Administrator', 'Administratie'))
      AND p.id != current_user_id
    ORDER BY p.full_name;
  ELSE
    -- Other roles get no chat access
    RETURN;
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_available_chat_users(uuid) TO authenticated;

-- ✅ KLAAR! De chat database is nu correct geconfigureerd.
-- Test door een bericht te sturen in de applicatie.

