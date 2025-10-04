-- 📸 CHAT MEDIA SUPPORT - Database Schema
-- Voer dit uit in Supabase SQL Editor

-- STAP 1: Voeg media kolommen toe aan direct_messages
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_filename TEXT,
ADD COLUMN IF NOT EXISTS media_size INTEGER,
ADD COLUMN IF NOT EXISTS media_mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS voice_duration INTEGER;

-- STAP 2: Maak indexes voor media queries
CREATE INDEX IF NOT EXISTS idx_direct_messages_media_type 
ON direct_messages(media_type) 
WHERE media_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_direct_messages_with_media 
ON direct_messages(from_user_id, created_at DESC) 
WHERE media_url IS NOT NULL;

-- STAP 3: Update content kolom constraint (kan NULL zijn als media aanwezig is)
ALTER TABLE direct_messages 
ALTER COLUMN content DROP NOT NULL;

-- STAP 4: Voeg constraint toe: content OF media moet aanwezig zijn
ALTER TABLE direct_messages
ADD CONSTRAINT content_or_media_required 
CHECK (
  (content IS NOT NULL AND content != '') 
  OR 
  (media_url IS NOT NULL AND media_url != '')
);

-- STAP 5: Verifieer de nieuwe kolommen
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'direct_messages' 
AND column_name IN ('media_type', 'media_url', 'media_filename', 'media_size', 'media_mime_type', 'voice_duration')
ORDER BY ordinal_position;

-- STAP 6: Test data types
COMMENT ON COLUMN direct_messages.media_type IS 'Type: photo, file, voice';
COMMENT ON COLUMN direct_messages.media_url IS 'Supabase Storage URL';
COMMENT ON COLUMN direct_messages.media_filename IS 'Original filename';
COMMENT ON COLUMN direct_messages.media_size IS 'File size in bytes';
COMMENT ON COLUMN direct_messages.media_mime_type IS 'MIME type (image/jpeg, audio/webm, etc)';
COMMENT ON COLUMN direct_messages.voice_duration IS 'Voice message duration in seconds';

-- ✅ SUCCESS! Database klaar voor media berichten
-- Media types: 'photo', 'file', 'voice'

