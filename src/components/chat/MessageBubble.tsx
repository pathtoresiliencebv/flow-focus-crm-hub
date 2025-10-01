import React from 'react';
import { DirectMessage } from '@/hooks/useFixedChat';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  userLanguage?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  userLanguage = 'nl'
}) => {
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: nl });
    } catch {
      return '';
    }
  };

  // Determine which text to display
  const displayText = message.translated_content?.[userLanguage] || message.content;
  const isTranslated = message.translated_content && message.translated_content[userLanguage] && message.original_language !== userLanguage;

  return (
    <div className={cn(
      "flex flex-col",
      isOwn ? "items-end" : "items-start"
    )}>
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-2 break-words",
        isOwn 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted text-foreground rounded-bl-md"
      )}>
        <p className="text-sm">{displayText}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className={cn(
            "text-xs opacity-70",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {formatTime(message.created_at)}
          </p>
          {isTranslated && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              isOwn ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
            )}>
              🌍
            </span>
          )}
        </div>
      </div>
    </div>
  );
};