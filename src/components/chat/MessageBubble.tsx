import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Reply, Heart, Globe, Volume2, Download } from 'lucide-react';
import { format } from 'date-fns';

interface DirectMessage {
  id: string;
  content: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  message_type?: string;
  file_url?: string;
  file_name?: string;
  audio_duration?: number;
  transcription_text?: string;
  translated_content?: any;
  detected_language?: string;
}

interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  showSender: boolean;
  senderName?: string;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onTranslate: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showSender,
  senderName,
  onReact,
  onReply,
  onTranslate
}) => {
  const isMedia = message.message_type === 'image' || message.message_type === 'file';
  const isVoice = message.message_type === 'voice';
  const hasTranslation = message.translated_content && Object.keys(message.translated_content).length > 0;

  return (
    <div className={cn(
      "flex gap-3 max-w-[80%]",
      isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      {showSender && !isOwn && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="text-xs">
            {senderName?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="space-y-1">
        {showSender && !isOwn && (
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm font-medium text-foreground">{senderName}</span>
            {message.detected_language && (
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                {message.detected_language.toUpperCase()}
              </Badge>
            )}
          </div>
        )}
        
        <div className={cn(
          "rounded-2xl px-4 py-2 relative group",
          isOwn 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-foreground"
        )}>
          {/* Message Content */}
          <div className="space-y-2">
            {isMedia && message.file_url && (
              <div className="space-y-2">
                {message.message_type === 'image' ? (
                  <img 
                    src={message.file_url} 
                    alt={message.file_name || 'Image'}
                    className="max-w-full h-auto rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.file_name || 'File'}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {isVoice && message.file_url && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/10">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Volume2 className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    Voice message {message.audio_duration && `(${Math.round(message.audio_duration)}s)`}
                  </div>
                  {message.transcription_text && (
                    <div className="text-xs opacity-75 mt-1">
                      "{message.transcription_text}"
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {message.content && !isMedia && !isVoice && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
            
            {hasTranslation && (
              <div className="mt-2 p-2 rounded-lg bg-background/10 border-l-2 border-primary/50">
                <div className="text-xs opacity-75 mb-1">Translation:</div>
                <p className="text-sm">
                  {Object.values(message.translated_content)[0] as string}
                </p>
              </div>
            )}
          </div>
          
          {/* Message Actions */}
          <div className={cn(
            "absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isOwn ? "-left-20" : "-right-20"
          )}>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={() => onReact('❤️')}
            >
              <Heart className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={onReply}
            >
              <Reply className="h-3 w-3" />
            </Button>
            {!hasTranslation && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={onTranslate}
              >
                <Globe className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        <div className={cn(
          "text-xs text-muted-foreground px-2",
          isOwn ? "text-right" : "text-left"
        )}>
          {format(new Date(message.created_at), 'HH:mm')}
        </div>
      </div>
    </div>
  );
};