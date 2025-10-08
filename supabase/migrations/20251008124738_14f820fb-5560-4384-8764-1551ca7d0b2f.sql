-- Phase 1: Create multilingual database structure

-- 1. Create supported_languages table
CREATE TABLE IF NOT EXISTS supported_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code VARCHAR(5) NOT NULL UNIQUE,
  language_name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  ui_supported BOOLEAN DEFAULT true,
  deepl_code VARCHAR(5) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data for the 5 languages
INSERT INTO supported_languages (language_code, language_name, native_name, flag_emoji, deepl_code) VALUES
  ('nl', 'Dutch', 'Nederlands', '🇳🇱', 'NL'),
  ('en', 'English', 'English', '🇬🇧', 'EN-GB'),
  ('pl', 'Polish', 'Polski', '🇵🇱', 'PL'),
  ('ro', 'Romanian', 'Română', '🇷🇴', 'RO'),
  ('tr', 'Turkish', 'Türkçe', '🇹🇷', 'TR')
ON CONFLICT (language_code) DO NOTHING;

-- RLS for supported_languages
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active languages"
  ON supported_languages FOR SELECT
  USING (is_active = true);

-- 2. Create user_language_preferences table
CREATE TABLE IF NOT EXISTS user_language_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'nl',
  ui_language VARCHAR(5) NOT NULL DEFAULT 'nl',
  chat_translation_enabled BOOLEAN DEFAULT true,
  auto_detect_language BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS policies for user_language_preferences
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own language preferences"
  ON user_language_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own language preferences"
  ON user_language_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own language preferences"
  ON user_language_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Create ui_translations table
CREATE TABLE IF NOT EXISTS ui_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key TEXT NOT NULL,
  language_code VARCHAR(5) NOT NULL,
  translated_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(translation_key, language_code)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ui_translations_lookup 
  ON ui_translations(translation_key, language_code);

-- RLS for ui_translations
ALTER TABLE ui_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read translations"
  ON ui_translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON ui_translations FOR ALL
  USING (get_user_role(auth.uid()) = 'Administrator');

-- 4. Create trigger for automatic user_language_preferences
CREATE OR REPLACE FUNCTION create_user_language_preferences()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_language_preferences (user_id, preferred_language, ui_language)
  VALUES (NEW.id, 'nl', 'nl')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_created_language_prefs ON auth.users;
CREATE TRIGGER on_user_created_language_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_language_preferences();

-- 5. Migrate existing users to user_language_preferences
INSERT INTO user_language_preferences (user_id, preferred_language, ui_language)
SELECT id, 
       COALESCE(language_preference, 'nl') as preferred_language,
       COALESCE(language_preference, 'nl') as ui_language
FROM profiles
ON CONFLICT (user_id) DO NOTHING;