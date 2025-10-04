-- 🔧 FIX: Taal voorkeur opslaan
-- Voer dit uit in Supabase SQL Editor

-- STAP 1: Voeg chat_language kolom toe aan profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chat_language VARCHAR(5) DEFAULT 'nl';

-- STAP 2: Update bestaande users
UPDATE profiles 
SET chat_language = 'nl' 
WHERE chat_language IS NULL;

-- STAP 3: Maak index voor performance
CREATE INDEX IF NOT EXISTS idx_profiles_chat_language 
ON profiles(chat_language);

-- STAP 4: Verifieer dat de kolom bestaat
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'chat_language';

-- STAP 5: Check current users en hun taal
SELECT 
    id, 
    full_name, 
    role,
    chat_language,
    COALESCE(chat_language, 'nl') as effective_language
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- ✅ SUCCESS!
-- Nu kun je je taal voorkeur opslaan in de chat UI

