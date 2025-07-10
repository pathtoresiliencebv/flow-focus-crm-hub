# Fase 2: Media Upload Functionaliteit

## Doelstellingen
- File upload systeem voor chat
- Camera integratie voor foto's
- Voice message systeem met transcriptie
- Preview functionaliteit voor alle media types

## Te Implementeren Bestanden

### 2.1 Chat File Upload Hook
**Bestand**: `src/hooks/useChatFileUpload.ts`

```typescript
interface FileUploadConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  autoCompress: boolean;
  generateThumbnails: boolean;
}

interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

interface UseChatFileUploadReturn {
  uploadFile: (file: File, messageId?: string) => Promise<UploadedFile>;
  uploadMultiple: (files: File[]) => Promise<UploadedFile[]>;
  progress: UploadProgress[];
  isUploading: boolean;
  cancelUpload: (fileId: string) => void;
}
```

**Features**:
- Drag & drop interface
- Progress indicators
- File type validatie
- Automatische compressie voor afbeeldingen
- Thumbnail generatie
- Batch upload ondersteuning

### 2.2 Camera Capture Component
**Bestand**: `src/components/chat/CameraCapture.tsx`

```typescript
interface CameraCaptureProps {
  onCapture: (imageFile: File) => void;
  onCancel: () => void;
  quality?: number;
  facingMode?: 'user' | 'environment';
  maxWidth?: number;
  maxHeight?: number;
}

// Features:
// - Web Camera API voor browser
// - Capacitor Camera Plugin voor native apps
// - Voorvertoning en bewerking opties
// - Automatische compressie
// - Metadata extraction (EXIF)
```

### 2.3 Voice Recorder Component
**Bestand**: `src/components/chat/VoiceRecorder.tsx`

```typescript
interface VoiceRecorderProps {
  onRecordingComplete: (audioFile: File, transcription?: string) => void;
  onCancel: () => void;
  maxDuration?: number; // in seconds
  autoTranscribe?: boolean;
  showWaveform?: boolean;
}

interface VoiceRecording {
  audioBlob: Blob;
  duration: number;
  transcription?: string;
  confidence?: number;
}

// Features:
// - Waveform visualisatie tijdens opname
// - Automatische transcriptie naar tekst
// - Playback controls voor preview
// - Opname kwaliteit instellingen
// - Noise reduction
```

### 2.4 Media Preview Component
**Bestand**: `src/components/chat/MediaPreview.tsx`

```typescript
interface MediaPreviewProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  thumbnail?: string;
  transcription?: string;
  onDownload?: () => void;
  onDelete?: () => void;
}

// Ondersteunde preview types:
// - Afbeeldingen: JPEG, PNG, GIF, WebP, SVG
// - Documenten: PDF (eerste pagina preview)
// - Audio: Waveform + playback controls
// - Video: Thumbnail + duration
// - Andere: File icon + metadata
```

### 2.5 Storage Configuration

```sql
-- Storage bucket voor chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'chat-files', 
  'chat-files', 
  false,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'audio/*', 'video/*', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.*']
);

-- RLS policies voor chat files
CREATE POLICY "Users can upload to chat-files bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own chat files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chat files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 2.6 Database Schema Uitbreidingen

```sql
-- Uitbreiden direct_messages tabel voor media support
ALTER TABLE direct_messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
ALTER TABLE direct_messages ADD COLUMN file_url TEXT;
ALTER TABLE direct_messages ADD COLUMN file_name TEXT;
ALTER TABLE direct_messages ADD COLUMN file_size INTEGER;
ALTER TABLE direct_messages ADD COLUMN file_type VARCHAR(100);
ALTER TABLE direct_messages ADD COLUMN thumbnail_url TEXT;
ALTER TABLE direct_messages ADD COLUMN audio_duration INTEGER; -- in seconds
ALTER TABLE direct_messages ADD COLUMN transcription_text TEXT;
ALTER TABLE direct_messages ADD COLUMN transcription_confidence DECIMAL(3,2);

-- Nieuwe tabel voor file metadata
CREATE TABLE chat_file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER, -- voor afbeeldingen
  height INTEGER, -- voor afbeeldingen
  duration INTEGER, -- voor audio/video
  metadata JSONB, -- EXIF, etc.
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.7 Edge Function: File Analysis
**Bestand**: `supabase/functions/file-analysis/index.ts`

```typescript
interface FileAnalysisRequest {
  fileUrl: string;
  fileType: string;
  generateThumbnail?: boolean;
  extractText?: boolean;
  analyzeContent?: boolean;
}

interface FileAnalysisResponse {
  thumbnail?: string;
  extractedText?: string;
  metadata: {
    dimensions?: { width: number; height: number };
    duration?: number;
    format?: string;
    size: number;
  };
  contentAnalysis?: {
    description?: string;
    objects?: string[];
    text?: string;
    language?: string;
  };
}

// Features:
// - Thumbnail generatie voor afbeeldingen en video's
// - Text extractie uit PDF's en documenten
// - EXIF data extractie
// - Content analysis met AI (optioneel)
// - Virus scanning (optioneel)
```

## Acceptatie Criteria
- [ ] Gebruikers kunnen bestanden uploaden via drag & drop
- [ ] Camera werkt op zowel web als mobile app
- [ ] Voice messages worden automatisch getranscribeerd
- [ ] Alle media types tonen correcte preview
- [ ] Upload progress wordt getoond
- [ ] Files worden veilig opgeslagen met correcte permissions
- [ ] Thumbnails worden automatisch gegenereerd

## Testing Scenario's
1. **File Upload**: Test verschillende bestandstypes en groottes
2. **Camera**: Test op verschillende devices en browsers
3. **Voice Recording**: Test transcriptie accuracy
4. **Preview**: Test preview voor alle ondersteunde formats
5. **Permissions**: Test RLS policies voor file access
6. **Error Handling**: Test netwerk issues en grote bestanden

## Dependencies
```json
{
  "react-dropzone": "^14.2.3",
  "@capacitor/camera": "^5.0.0",
  "@capacitor/filesystem": "^5.0.0",
  "react-audio-visualize": "^1.0.0",
  "pdfjs-dist": "^3.11.0",
  "mammoth": "^1.6.0",
  "heic2any": "^0.0.3"
}
```