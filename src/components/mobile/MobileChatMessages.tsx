import React, { useState, useCallback } from 'react';
import { Globe, Volume2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { enhancedTranslationService } from "@/services/enhancedTranslationService";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  content?: string;
  sender_id?: string;
  sender?: {
    full_name?: string;
  };
  created_at: string;
  message_type?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  audio_duration?: number;
  transcription_text?: string;
  detected_language?: string;
}

interface MobileChatMessagesProps {
  messages: ChatMessage[];
  currentUserId?: string;
  userLanguage: string;
}

export const MobileChatMessages: React.FC<MobileChatMessagesProps> = ({
  messages,
  currentUserId,
  userLanguage
}) => {
  const { toast } = useToast();
  const [translatedMessages, setTranslatedMessages] = useState<Map<string, string>>(new Map());
  const [translatingMessages, setTranslatingMessages] = useState<Set<string>>(new Set());

  const formatTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleTimeString("nl-NL", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const translateMessage = useCallback(async (message: ChatMessage) => {
    if (!message.content || translatedMessages.has(message.id)) return;

    const fromLang = message.detected_language || 'nl';
    const toLang = userLanguage;
    
    if (fromLang === toLang) return;

    setTranslatingMessages(prev => new Set(prev).add(message.id));

    try {
      const result = await enhancedTranslationService.translateText({
        text: message.content,
        fromLanguage: fromLang,
        toLanguage: toLang,
        context: 'casual'
      });

      setTranslatedMessages(prev => new Map(prev).set(message.id, result.translatedText));
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Vertaling mislukt",
        description: "Kon bericht niet vertalen",
        variant: "destructive"
      });
    } finally {
      setTranslatingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(message.id);
        return newSet;
      });
    }
  }, [userLanguage, translatedMessages, toast]);

  const playAudio = useCallback((audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast({
        title: "Audio fout",
        description: "Kon audio niet afspelen",
        variant: "destructive"
      });
    });
  }, [toast]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          const translatedText = translatedMessages.get(message.id);
          const isTranslating = translatingMessages.has(message.id);
          const showTranslation = message.detected_language && message.detected_language !== userLanguage;

          return (
            <div key={message.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
              {!isOwnMessage && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="text-xs">
                    {message.sender?.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[85%]`}>
                {!isOwnMessage && (
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {message.sender?.full_name || "Onbekende gebruiker"}
                    </p>
                    {message.detected_language && (
                      <Badge variant="outline" className="text-xs">
                        {message.detected_language.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className={`p-3 rounded-lg ${
                  isOwnMessage 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  {/* File/Media Content */}
                  {message.file_url && (
                    <div className="mb-2">
                      {message.message_type === 'image' ? (
                        <img 
                          src={message.file_url} 
                          alt={message.file_name}
                          className="max-w-full h-auto rounded-md cursor-pointer"
                          onClick={() => window.open(message.file_url, '_blank')}
                        />
                      ) : message.message_type === 'voice' ? (
                        <div className="flex items-center gap-2 bg-white/10 p-2 rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playAudio(message.file_url!)}
                            className="h-8 w-8 p-0"
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                          <div className="flex-1">
                            <div className="text-xs opacity-75">
                              Spraakbericht ({Math.round(message.audio_duration || 0)}s)
                            </div>
                            {message.transcription_text && (
                              <div className="text-xs mt-1 italic">
                                "{message.transcription_text}"
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-white/10 p-2 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{message.file_name}</div>
                            {message.file_size && (
                              <div className="text-xs opacity-75">
                                {formatFileSize(message.file_size)}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(message.file_url, '_blank')}
                            className="text-xs"
                          >
                            Open
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {message.content && (
                    <div className="text-sm">
                      {message.content}
                    
                    {/* Translation */}
                    {translatedText && (
                      <div className={`mt-2 pt-2 border-t ${
                        isOwnMessage ? "border-primary-foreground/20" : "border-muted-foreground/20"
                      }`}>
                        <div className="flex items-center gap-1 mb-1">
                          <Globe className="h-3 w-3" />
                          <span className="text-xs opacity-75">Vertaling:</span>
                        </div>
                        <div className="text-sm italic">{translatedText}</div>
                      </div>
                    )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatTime(message.created_at)}
                  </p>
                  
                  {/* Translation Button */}
                  {showTranslation && !translatedText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => translateMessage(message)}
                      disabled={isTranslating}
                      className="h-6 px-2 text-xs"
                    >
                      {isTranslating ? (
                        <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Vertaal
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nog geen berichten</p>
            <p className="text-sm mt-1">Start de conversatie!</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};