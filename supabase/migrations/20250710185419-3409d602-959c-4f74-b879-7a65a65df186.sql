-- Uitbreiden profiles tabel voor taalvoorkeuren
ALTER TABLE profiles ADD COLUMN language_preference VARCHAR(5) DEFAULT 'nl';
ALTER TABLE profiles ADD COLUMN timezone VARCHAR(50) DEFAULT 'Europe/Amsterdam';  
ALTER TABLE profiles ADD COLUMN language_detection_enabled BOOLEAN DEFAULT TRUE;

-- Uitbreiden direct_messages tabel voor media en AI support
ALTER TABLE direct_messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
ALTER TABLE direct_messages ADD COLUMN file_url TEXT;
ALTER TABLE direct_messages ADD COLUMN file_name TEXT;
ALTER TABLE direct_messages ADD COLUMN file_size INTEGER;
ALTER TABLE direct_messages ADD COLUMN file_type VARCHAR(100);
ALTER TABLE direct_messages ADD COLUMN thumbnail_url TEXT;
ALTER TABLE direct_messages ADD COLUMN audio_duration INTEGER;
ALTER TABLE direct_messages ADD COLUMN transcription_text TEXT;
ALTER TABLE direct_messages ADD COLUMN detected_language VARCHAR(5);
ALTER TABLE direct_messages ADD COLUMN translation_confidence DECIMAL(3,2);
ALTER TABLE direct_messages ADD COLUMN context_type VARCHAR(20) DEFAULT 'casual';

-- Nieuwe tabel voor translation cache
CREATE TABLE translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_language VARCHAR(5) NOT NULL,
  target_language VARCHAR(5) NOT NULL,
  translated_text TEXT NOT NULL,
  context_type VARCHAR(20),
  confidence DECIMAL(3,2),
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index voor snelle cache lookups
CREATE INDEX idx_translation_cache_lookup ON translation_cache(source_text, source_language, target_language);

-- Enable RLS voor translation_cache
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;

-- Policy voor translation cache - authenticated users kunnen lezen en schrijven
CREATE POLICY "Translation cache access" ON translation_cache FOR ALL TO authenticated USING (true);

-- Storage bucket voor chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', false);

-- Storage policies voor chat files
CREATE POLICY "Users can view chat files" ON storage.objects FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "Users can upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their chat files" ON storage.objects FOR UPDATE USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their chat files" ON storage.objects FOR DELETE USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);