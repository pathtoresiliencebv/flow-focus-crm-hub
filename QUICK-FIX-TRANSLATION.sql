-- 🚨 QUICK FIX: Chat Translation Database Setup
-- Voer dit uit in Supabase SQL Editor

-- STAP 1: Voeg chat_language toe aan profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chat_language VARCHAR(5) DEFAULT 'nl';

-- STAP 2: Update bestaande users
UPDATE profiles SET chat_language = 'nl' WHERE chat_language IS NULL;

-- STAP 3: Voeg translated_content toe aan direct_messages
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS translated_content JSONB;

-- STAP 4: Zorg dat original_language bestaat
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS original_language VARCHAR(5) DEFAULT 'nl';

-- STAP 5: Update bestaande berichten
UPDATE direct_messages 
SET original_language = 'nl' 
WHERE original_language IS NULL;

-- STAP 6: Maak indexes voor performance
CREATE INDEX IF NOT EXISTS idx_profiles_chat_language ON profiles(chat_language);
CREATE INDEX IF NOT EXISTS idx_messages_original_language ON direct_messages(original_language);

-- STAP 7: Verifieer de setup
SELECT 
    'profiles.chat_language' as kolom,
    COUNT(*) as aantal_users,
    string_agg(DISTINCT chat_language::text, ', ') as talen
FROM profiles
WHERE chat_language IS NOT NULL
UNION ALL
SELECT 
    'direct_messages.original_language' as kolom,
    COUNT(*) as aantal_berichten,
    string_agg(DISTINCT original_language::text, ', ') as talen
FROM direct_messages
WHERE original_language IS NOT NULL;

-- ✅ SUCCESS! Database is klaar voor vertaling
-- ❗ VOLGENDE STAP: DeepL API key toevoegen in Edge Functions

