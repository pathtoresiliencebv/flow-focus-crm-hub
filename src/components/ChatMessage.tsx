
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Play, Languages, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation, TranslationResult } from '@/hooks/useTranslation';

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  role: "admin" | "monteur";
  language: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  translatedContent?: string;
  timestamp: Date;
  type: "text" | "image" | "file" | "voice";
  fileUrl?: string;
  fileName?: string;
  detected_language?: string;
  original_language?: string;
}

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: ChatUser;
}

export const ChatMessage = ({ message, isOwnMessage, sender }: ChatMessageProps) => {
  const { 
    userPreferences, 
    translateMessage, 
    getLanguageFlag, 
    getLanguageName,
    t 
  } = useTranslation();
  
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  // Auto-translate messages if needed
  useEffect(() => {
    const shouldTranslate = 
      message.type === 'text' && 
      !isOwnMessage && 
      userPreferences.chat_translation_enabled &&
      message.detected_language &&
      message.detected_language !== userPreferences.preferred_language;

    if (shouldTranslate && !translation) {
      performTranslation();
    }
  }, [message, userPreferences, isOwnMessage]);

  const performTranslation = async () => {
    if (isTranslating || !message.content) return;

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const result = await translateMessage(
        message.content,
        userPreferences.preferred_language,
        message.id,
        message.detected_language || message.original_language
      );

      if (result.error) {
        setTranslationError(result.error);
      } else {
        setTranslation(result);
      }
    } catch (error) {
      setTranslationError(error instanceof Error ? error.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const canTranslate = 
    message.type === 'text' && 
    !isOwnMessage && 
    message.detected_language &&
    message.detected_language !== userPreferences.preferred_language;

  const renderMessageContent = () => {
    switch (message.type) {
      case "image":
        return (
          <img 
            src={message.fileUrl} 
            alt="Shared image" 
            className="max-w-xs rounded-lg"
          />
        );
      case "file":
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">{message.fileName}</p>
              <p className="text-xs text-gray-500">Bestand</p>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      case "voice":
        return (
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
            <Button variant="ghost" size="sm">
              <Play className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="h-2 bg-gray-300 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full w-1/3"></div>
              </div>
            </div>
            <span className="text-xs text-gray-500">0:15</span>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            {/* Original message */}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm">{message.content}</p>
              </div>
              {canTranslate && message.detected_language && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {getLanguageFlag(message.detected_language)} {message.detected_language.toUpperCase()}
                  </Badge>
                  {!userPreferences.chat_translation_enabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={performTranslation}
                      disabled={isTranslating}
                      className="h-6 w-6 p-0"
                    >
                      <Languages className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Translation */}
            {userPreferences.chat_translation_enabled && (translation || isTranslating || translationError) && (
              <div className="border-t pt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {getLanguageFlag(userPreferences.preferred_language)} {t('chat.translated', 'Translated')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="h-6 w-6 p-0"
                  >
                    {showTranslation ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>

                {showTranslation && (
                  <>
                    {isTranslating && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                        {t('chat.translating', 'Translating...')}
                      </div>
                    )}

                    {translationError && (
                      <div className="text-xs text-red-500">
                        {t('chat.translation_error', 'Translation failed')}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={performTranslation}
                          className="ml-2 h-4 text-xs underline"
                        >
                          {t('common.retry', 'Retry')}
                        </Button>
                      </div>
                    )}

                    {translation && !translation.error && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground italic">
                          {translation.translatedText}
                        </p>
                        {translation.confidence < 0.8 && (
                          <p className="text-xs text-orange-500">
                            {t('chat.low_confidence', 'Translation confidence is low')}
                          </p>
                        )}
                        {translation.cached && (
                          <p className="text-xs text-green-600">
                            {t('chat.cached_translation', 'Cached translation')}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Legacy translated content support */}
            {message.translatedContent && message.translatedContent !== message.content && !translation && (
              <div className="border-t pt-2">
                <Badge variant="outline" className="mb-1 text-xs">
                  {t('chat.translated', 'Translated')}
                </Badge>
                <p className="text-sm text-muted-foreground italic">
                  {message.translatedContent}
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      {!isOwnMessage && sender && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} />
          <AvatarFallback className="text-xs">
            {sender.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-xs`}>
        {!isOwnMessage && sender && (
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-gray-700">{sender.name}</p>
            <Badge variant="secondary" className="text-xs">
              {getLanguageFlag(sender.language)} {sender.language.toUpperCase()}
            </Badge>
          </div>
        )}
        
        <Card className={`${isOwnMessage ? "bg-blue-500 text-white" : "bg-white"} shadow-sm`}>
          <CardContent className="p-3">
            {renderMessageContent()}
          </CardContent>
        </Card>
        
        <p className="text-xs text-gray-500 mt-1">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};
