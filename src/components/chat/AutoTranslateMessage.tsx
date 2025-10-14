import React, { useState, useEffect } from 'react';
import { MessageSimple } from 'stream-chat-react';
import { useAutoTranslate } from '@/hooks/use-auto-translate';
import { useAuth } from '@/contexts/AuthContext';

interface AutoTranslateMessageProps {
  message: any;
  channel: any;
  readBy: any[];
  renderText?: (text: string) => React.ReactNode;
}

export const AutoTranslateMessage: React.FC<AutoTranslateMessageProps> = ({
  message,
  channel,
  readBy,
  renderText
}) => {
  const { autoTranslateMessage, getTranslatedMessage } = useAutoTranslate();
  const { user } = useAuth();
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Don't translate own messages - safe check for both user and message.user
  const isOwnMessage = user && message.user ? message.user.id === user.id : false;

  useEffect(() => {
    if (isOwnMessage || !message.text) {
      setTranslatedText(message.text || '');
      return;
    }

    const translateMessage = async () => {
      setIsTranslating(true);
      try {
        const translated = await autoTranslateMessage(
          message.id,
          message.text,
          message.user?.language || 'nl'
        );
        setTranslatedText(translated);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedText(message.text);
      } finally {
        setIsTranslating(false);
      }
    };

    translateMessage();
  }, [message.id, message.text, message.user?.id, isOwnMessage, autoTranslateMessage]);

  // Create modified message with translated text
  const modifiedMessage = {
    ...message,
    text: translatedText
  };

  return (
    <div className="relative">
      <MessageSimple
        message={modifiedMessage}
        channel={channel}
        readBy={readBy}
        renderText={renderText}
      />
      {isTranslating && (
        <div className="absolute top-0 right-0 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded">
          Vertalen...
        </div>
      )}
    </div>
  );
};
