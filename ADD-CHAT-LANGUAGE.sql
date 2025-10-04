-- 🌍 CHAT TRANSLATION - Database Schema
-- Voeg taal voorkeur toe aan profiles

-- STAP 1: Voeg chat_language column toe aan profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chat_language VARCHAR(5) DEFAULT 'nl';

-- STAP 2: Update bestaande users met default taal
UPDATE profiles SET chat_language = 'nl' WHERE chat_language IS NULL;

-- STAP 3: Voeg index toe voor snelle lookup
CREATE INDEX IF NOT EXISTS idx_profiles_chat_language ON profiles(chat_language);

-- STAP 4: Verifieer de kolom bestaat
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'chat_language';

-- STAP 5: Check huidige talen
SELECT chat_language, COUNT(*) as aantal 
FROM profiles 
GROUP BY chat_language;

-- ✅ KLAAR! Users kunnen nu hun chat taal instellen
-- Supported: nl, pl, en, de, fr, es

