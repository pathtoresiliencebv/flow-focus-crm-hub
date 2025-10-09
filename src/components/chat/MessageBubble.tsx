import React from 'react';
import { DirectMessage } from '@/hooks/useFixedChat';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';

interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  userLanguage?: string; // Kept for backward compatibility, but will use i18n context if not provided
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  userLanguage: userLanguageProp
}) => {
  const { language } = useI18n(); // Get language from i18n context
  const userLanguage = userLanguageProp || language; // Use prop if provided, otherwise context

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
          ? "bg-[hsl(0,71%,36%)] text-white rounded-br-md" 
          : "bg-gray-100 text-gray-900 rounded-bl-md"
      )}>
        <p className="text-sm">{displayText}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className={cn(
            "text-xs opacity-70",
            isOwn ? "text-white/70" : "text-gray-500"
          )}>
            {formatTime(message.created_at)}
          </p>
          {isTranslated && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              isOwn ? "bg-white/20" : "bg-gray-500/20"
            )}>
              🌍
            </span>
          )}
        </div>
      </div>
    </div>
  );
};