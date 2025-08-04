-- Multi-language support and translation system

-- User language preferences
CREATE TABLE IF NOT EXISTS user_language_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'nl', -- ISO 639-1 codes
  ui_language VARCHAR(10) NOT NULL DEFAULT 'nl',
  chat_translation_enabled BOOLEAN DEFAULT true,
  auto_detect_language BOOLEAN DEFAULT true,
  translation_provider VARCHAR(50) DEFAULT 'google',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message translations cache
CREATE TABLE IF NOT EXISTS message_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE NOT NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.9,
  translation_provider VARCHAR(50) DEFAULT 'google',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, target_language)
);

-- Supported languages configuration
CREATE TABLE IF NOT EXISTS supported_languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL UNIQUE, -- ISO 639-1
  language_name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100) NOT NULL,
  flag_emoji VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  translation_supported BOOLEAN DEFAULT true,
  ui_supported BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UI translations for interface elements
CREATE TABLE IF NOT EXISTS ui_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  translation_key VARCHAR(255) NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  translated_text TEXT NOT NULL,
  context VARCHAR(255), -- component, page, or section
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(translation_key, language_code)
);

-- Add language column to chat_messages for source language tracking
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS detected_language VARCHAR(10) DEFAULT 'nl',
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10) DEFAULT 'nl';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_translations_message_id ON message_translations(message_id);
CREATE INDEX IF NOT EXISTS idx_message_translations_target_language ON message_translations(target_language);
CREATE INDEX IF NOT EXISTS idx_user_language_preferences_user_id ON user_language_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_supported_languages_code ON supported_languages(language_code);
CREATE INDEX IF NOT EXISTS idx_ui_translations_key_lang ON ui_translations(translation_key, language_code);
CREATE INDEX IF NOT EXISTS idx_chat_messages_language ON chat_messages(detected_language);

-- Enable RLS
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own language preferences" ON user_language_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view message translations for their messages" ON message_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN chat_channels cc ON cm.channel_id = cc.id
      JOIN chat_channel_members ccm ON cc.id = ccm.channel_id
      WHERE cm.id = message_translations.message_id
      AND ccm.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all translations" ON message_translations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Everyone can view supported languages" ON supported_languages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage supported languages" ON supported_languages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Administrator'
    )
  );

CREATE POLICY "Everyone can view UI translations" ON ui_translations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage UI translations" ON ui_translations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Administrator'
    )
  );

-- Insert default supported languages
INSERT INTO supported_languages (language_code, language_name, native_name, flag_emoji, ui_supported, sort_order) VALUES
('nl', 'Dutch', 'Nederlands', '🇳🇱', true, 1),
('en', 'English', 'English', '🇬🇧', true, 2),
('pl', 'Polish', 'Polski', '🇵🇱', true, 3),
('de', 'German', 'Deutsch', '🇩🇪', false, 4),
('fr', 'French', 'Français', '🇫🇷', false, 5),
('es', 'Spanish', 'Español', '🇪🇸', false, 6),
('it', 'Italian', 'Italiano', '🇮🇹', false, 7),
('pt', 'Portuguese', 'Português', '🇵🇹', false, 8),
('ro', 'Romanian', 'Română', '🇷🇴', false, 9),
('hu', 'Hungarian', 'Magyar', '🇭🇺', false, 10)
ON CONFLICT (language_code) DO NOTHING;

-- Insert default UI translations for Dutch (base language)
INSERT INTO ui_translations (translation_key, language_code, translated_text, context) VALUES
-- Common UI elements
('common.save', 'nl', 'Opslaan', 'common'),
('common.cancel', 'nl', 'Annuleren', 'common'),
('common.delete', 'nl', 'Verwijderen', 'common'),
('common.edit', 'nl', 'Bewerken', 'common'),
('common.add', 'nl', 'Toevoegen', 'common'),
('common.close', 'nl', 'Sluiten', 'common'),
('common.loading', 'nl', 'Laden...', 'common'),
('common.error', 'nl', 'Fout', 'common'),
('common.success', 'nl', 'Succesvol', 'common'),

-- English translations
('common.save', 'en', 'Save', 'common'),
('common.cancel', 'en', 'Cancel', 'common'),
('common.delete', 'en', 'Delete', 'common'),
('common.edit', 'en', 'Edit', 'common'),
('common.add', 'en', 'Add', 'common'),
('common.close', 'en', 'Close', 'common'),
('common.loading', 'en', 'Loading...', 'common'),
('common.error', 'en', 'Error', 'common'),
('common.success', 'en', 'Success', 'common'),

-- Polish translations
('common.save', 'pl', 'Zapisz', 'common'),
('common.cancel', 'pl', 'Anuluj', 'common'),
('common.delete', 'pl', 'Usuń', 'common'),
('common.edit', 'pl', 'Edytuj', 'common'),
('common.add', 'pl', 'Dodaj', 'common'),
('common.close', 'pl', 'Zamknij', 'common'),
('common.loading', 'pl', 'Ładowanie...', 'common'),
('common.error', 'pl', 'Błąd', 'common'),
('common.success', 'pl', 'Sukces', 'common')

ON CONFLICT (translation_key, language_code) DO NOTHING;

-- Function to get user's preferred language
CREATE OR REPLACE FUNCTION get_user_language(target_user_id UUID DEFAULT auth.uid())
RETURNS VARCHAR(10) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT preferred_language FROM user_language_preferences WHERE user_id = target_user_id),
    'nl' -- Default to Dutch
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect message language (placeholder for AI detection)
CREATE OR REPLACE FUNCTION detect_message_language(message_text TEXT)
RETURNS VARCHAR(10) AS $$
BEGIN
  -- Simple heuristic-based language detection
  -- In production, this would use a proper language detection service
  
  -- Dutch indicators
  IF message_text ~* '\b(de|het|een|van|voor|naar|met|op|in|dat|is|zijn|hebben|maar|ook|niet|nog|wel|wat|wie|waar|wanneer|hoe|waarom)\b' THEN
    RETURN 'nl';
  END IF;
  
  -- English indicators
  IF message_text ~* '\b(the|and|for|are|but|not|you|all|can|had|was|one|our|out|day|get|use|man|new|now|way|may|say|each|which|she|how|its|who|oil|sit|call|now)\b' THEN
    RETURN 'en';
  END IF;
  
  -- Polish indicators
  IF message_text ~* '\b(to|na|w|z|i|nie|się|że|do|o|od|za|po|przez|dla|pod|nad|przy|bez|co|jak|czy|gdy|już|tylko|też|bardzo|może|gdzie|kiedy|dlaczego)\b' THEN
    RETURN 'pl';
  END IF;
  
  -- Default to Dutch if uncertain
  RETURN 'nl';
END;
$$ LANGUAGE plpgsql;

-- Trigger to detect language when inserting messages
CREATE OR REPLACE FUNCTION set_message_language()
RETURNS TRIGGER AS $$
BEGIN
  NEW.detected_language = detect_message_language(NEW.content);
  NEW.original_language = NEW.detected_language;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_message_language
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_language();

-- Create default language preferences for existing users
INSERT INTO user_language_preferences (user_id, preferred_language, ui_language)
SELECT id, 'nl', 'nl' FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_language_preferences)
ON CONFLICT (user_id) DO NOTHING;