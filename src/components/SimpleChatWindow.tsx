import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDirectChat } from "@/hooks/useDirectChat";
import { useAuth } from "@/hooks/useAuth";

interface SimpleChatWindowProps {
  onClose: () => void;
}

export const SimpleChatWindow: React.FC<SimpleChatWindowProps> = ({ onClose }) => {
  const { user } = useAuth();
  const {
    messages,
    availableUsers,
    selectedUserId,
    setSelectedUserId,
    sendMessage,
    loading
  } = useDirectChat();
  
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectUser = (chatUser: any) => {
    setSelectedUserId(chatUser.id);
    setSelectedUser(chatUser);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    await sendMessage(selectedUserId, newMessage);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("nl-NL", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const handleBack = () => {
    if (selectedUser) {
      setSelectedUser(null);
      setSelectedUserId(null);
    } else {
      onClose();
    }
  };

  const getDisplayText = (message: any) => {
    // Show translated content if available and it's for our language
    const userLanguage = user?.id ? (availableUsers.find(u => u.id === user.id)?.role === 'Installateur' ? 'pl' : 'nl') : 'nl';
    
    if (message.translated_content && message.translated_content[userLanguage] && message.original_language !== userLanguage) {
      return message.translated_content[userLanguage];
    }
    
    return message.content;
  };

  const getLanguageFlag = (message: any) => {
    const userLanguage = user?.id ? (availableUsers.find(u => u.id === user.id)?.role === 'Installateur' ? 'pl' : 'nl') : 'nl';
    
    if (message.translated_content && message.translated_content[userLanguage] && message.original_language !== userLanguage) {
      return message.original_language === 'pl' ? '🇵🇱' : '🇳🇱';
    }
    
    return null;
  };

  // User list view
  if (!selectedUser) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Chat</h1>
          </div>
        </div>

        {/* Available users */}
        <ScrollArea className="flex-1 p-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">BESCHIKBARE PERSONEN</h3>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Laden...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableUsers.map((chatUser) => (
                  <div
                    key={chatUser.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectUser(chatUser)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {chatUser.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chatUser.full_name || "Onbekende gebruiker"}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{chatUser.role}</span>
                          <span className="text-xs">
                            {chatUser.role === 'Installateur' ? '🇵🇱' : '🇳🇱'}
                          </span>
                          {chatUser.is_online && (
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!loading && availableUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Geen personen beschikbaar</p>
                <p className="text-sm mt-1">Contact je administrator</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {selectedUser?.full_name || "Chat"}
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{selectedUser?.role}</p>
              <span className="text-xs">
                {selectedUser?.role === 'Installateur' ? '🇵🇱' : '🇳🇱'}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.from_user_id === user?.id ? "flex-row-reverse" : ""}`}>
              {message.from_user_id !== user?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {message.sender?.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex flex-col ${message.from_user_id === user?.id ? "items-end" : "items-start"} max-w-[75%]`}>
                {message.from_user_id !== user?.id && (
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {message.sender?.full_name || "Onbekende gebruiker"}
                    </p>
                  </div>
                )}
                
                <div className={`p-3 rounded-lg ${
                  message.from_user_id === user?.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  <div className="flex items-start gap-2">
                    <p className="text-sm flex-1">{getDisplayText(message)}</p>
                    {getLanguageFlag(message) && (
                      <span className="text-xs opacity-70 flex-shrink-0">
                        {getLanguageFlag(message)}
                      </span>
                    )}
                  </div>
                  
                  {/* Show original text if translated */}
                  {message.translated_content && getDisplayText(message) !== message.content && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-xs opacity-70 italic">
                        Origineel: {message.content}
                      </p>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type je bericht..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Berichten worden automatisch vertaald naar de juiste taal
        </p>
      </div>
    </div>
  );
};