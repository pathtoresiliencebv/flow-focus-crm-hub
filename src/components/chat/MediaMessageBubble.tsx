import React, { useState, useRef, useEffect } from 'react';
import { Download, Play, Pause, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface MediaMessageBubbleProps {
  mediaType: 'photo' | 'file' | 'voice';
  mediaUrl: string;
  mediaFilename?: string;
  mediaSize?: number;
  voiceDuration?: number;
  isOwn: boolean;
}

export const MediaMessageBubble: React.FC<MediaMessageBubbleProps> = ({
  mediaType,
  mediaUrl,
  mediaFilename,
  mediaSize,
  voiceDuration,
  isOwn
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate signed URL for media
  useEffect(() => {
    const getSignedUrl = async () => {
      if (!mediaUrl) {
        setLoading(false);
        return;
      }

      try {
        // Check if mediaUrl is already a full URL or a storage path
        if (mediaUrl.startsWith('http')) {
          // Already a full URL, use it directly
          setSignedUrl(mediaUrl);
          setLoading(false);
          return;
        }

        // Extract file path from mediaUrl (remove bucket URL prefix if present)
        let filePath = mediaUrl;
        
        // If mediaUrl contains the full public URL, extract just the path
        if (mediaUrl.includes('/storage/v1/object/public/chat-media/')) {
          filePath = mediaUrl.split('/storage/v1/object/public/chat-media/')[1];
        }

        console.log('🔐 Generating signed URL for:', filePath);

        // Generate signed URL (valid for 1 hour)
        const { data, error } = await supabase.storage
          .from('chat-media')
          .createSignedUrl(filePath, 3600);

        if (error) {
          console.error('❌ Error generating signed URL:', error);
          // Fallback to original URL
          setSignedUrl(mediaUrl);
        } else if (data?.signedUrl) {
          console.log('✅ Signed URL generated');
          setSignedUrl(data.signedUrl);
        } else {
          console.warn('⚠️ No signed URL returned, using original');
          setSignedUrl(mediaUrl);
        }
      } catch (err) {
        console.error('❌ Failed to get signed URL:', err);
        setSignedUrl(mediaUrl);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [mediaUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(signedUrl || mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mediaFilename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Photo message
  if (mediaType === 'photo') {
    if (loading) {
      return (
        <div className={cn(
          "max-w-[300px] h-[200px] rounded-lg overflow-hidden flex items-center justify-center bg-muted",
          isOwn ? "ml-auto" : "mr-auto"
        )}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    return (
      <div className={cn(
        "max-w-[300px] rounded-lg overflow-hidden cursor-pointer",
        isOwn ? "ml-auto" : "mr-auto"
      )}>
        <img 
          src={signedUrl || mediaUrl} 
          alt="Shared photo" 
          className="w-full h-auto"
          onClick={() => window.open(signedUrl || mediaUrl, '_blank')}
          onError={(e) => {
            console.error('❌ Image failed to load:', signedUrl || mediaUrl);
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23ddd" width="300" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EAfbeelding niet beschikbaar%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>
    );
  }

  // Voice message
  if (mediaType === 'voice') {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px]",
        isOwn 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted text-foreground rounded-bl-md"
      )}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          className={cn(
            "h-8 w-8 rounded-full flex-shrink-0",
            isOwn ? "hover:bg-primary-foreground/20" : "hover:bg-muted-foreground/20"
          )}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        
        <div className="flex-1">
          <div className="h-1 bg-current opacity-20 rounded-full">
            <div 
              className="h-full bg-current rounded-full transition-all"
              style={{ 
                width: voiceDuration ? `${(currentTime / voiceDuration) * 100}%` : '0%' 
              }}
            />
          </div>
          <div className={cn(
            "text-xs mt-1 opacity-70",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {formatTime(currentTime)} / {voiceDuration ? formatTime(voiceDuration) : '0:00'}
          </div>
        </div>

        <audio ref={audioRef} src={signedUrl || mediaUrl} preload="metadata" />
      </div>
    );
  }

  // File message
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[300px]",
      isOwn 
        ? "bg-primary text-primary-foreground rounded-br-md" 
        : "bg-muted text-foreground rounded-bl-md"
    )}>
      <div className={cn(
        "p-2 rounded-lg",
        isOwn ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
      )}>
        <FileText className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {mediaFilename || 'Bestand'}
        </div>
        <div className={cn(
          "text-xs opacity-70",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatFileSize(mediaSize)}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className={cn(
          "h-8 w-8 flex-shrink-0",
          isOwn ? "hover:bg-primary-foreground/20" : "hover:bg-muted-foreground/20"
        )}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};

