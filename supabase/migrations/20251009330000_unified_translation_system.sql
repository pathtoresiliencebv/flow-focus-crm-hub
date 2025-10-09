-- Unified Translation System Migration
-- Ensures user_language_preferences has all required columns and syncs ui_language with preferred_language

-- Ensure user_language_preferences has all required columns
ALTER TABLE user_language_preferences 
ADD COLUMN IF NOT EXISTS ui_language TEXT DEFAULT 'nl',
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'nl',
ADD COLUMN IF NOT EXISTS chat_translation_enabled BOOLEAN DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_language_prefs_user_id 
ON user_language_preferences(user_id);

-- Ensure ui_language and preferred_language are always in sync
CREATE OR REPLACE FUNCTION sync_language_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- When UI language changes, update chat language too
  IF NEW.ui_language IS DISTINCT FROM OLD.ui_language THEN
    NEW.preferred_language := NEW.ui_language;
  END IF;
  
  -- When chat language changes, update UI language too
  IF NEW.preferred_language IS DISTINCT FROM OLD.preferred_language THEN
    NEW.ui_language := NEW.preferred_language;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_language_trigger ON user_language_preferences;

-- Create trigger to sync languages
CREATE TRIGGER sync_language_trigger
BEFORE UPDATE ON user_language_preferences
FOR EACH ROW
EXECUTE FUNCTION sync_language_preferences();

-- Ensure ui_translations table exists
CREATE TABLE IF NOT EXISTS ui_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key TEXT NOT NULL,
  language_code TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(translation_key, language_code)
);

CREATE INDEX IF NOT EXISTS idx_ui_translations_key_lang 
ON ui_translations(translation_key, language_code);

-- Add updated_at trigger for ui_translations
CREATE OR REPLACE FUNCTION update_ui_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ui_translations_updated_at_trigger ON ui_translations;

CREATE TRIGGER ui_translations_updated_at_trigger
BEFORE UPDATE ON ui_translations
FOR EACH ROW
EXECUTE FUNCTION update_ui_translations_updated_at();

COMMENT ON TABLE ui_translations IS 'Stores all UI text translations for multiple languages';
COMMENT ON COLUMN ui_translations.translation_key IS 'Unique identifier for the text to translate (e.g., button_new_quote)';
COMMENT ON COLUMN ui_translations.language_code IS 'Language code (nl, en, pl, ro, tr)';
COMMENT ON COLUMN ui_translations.translated_text IS 'The translated text in the target language';
COMMENT ON COLUMN ui_translations.context IS 'Optional context for the translation (e.g., page name, component)';

