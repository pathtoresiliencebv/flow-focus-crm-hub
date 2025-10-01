import React, { useState, useRef, useEffect } from 'react';
import { Download, Play, Pause, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const audioRef = useRef<HTMLAudioElement>(null);

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
      const response = await fetch(mediaUrl);
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
    return (
      <div className={cn(
        "max-w-[300px] rounded-lg overflow-hidden cursor-pointer",
        isOwn ? "ml-auto" : "mr-auto"
      )}>
        <img 
          src={mediaUrl} 
          alt="Shared photo" 
          className="w-full h-auto"
          onClick={() => window.open(mediaUrl, '_blank')}
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

        <audio ref={audioRef} src={mediaUrl} preload="metadata" />
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

