import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat, ChatUser } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

interface SimpleChatWindowProps {
  onClose: () => void;
}

export const SimpleChatWindow: React.FC<SimpleChatWindowProps> = ({ onClose }) => {
  const { user } = useAuth();
  const {
    messages,
    selectedChannelId,
    setSelectedChannelId,
    sendMessage,
    createDirectChannel,
    availableUsers,
  } = useChat();
  
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [showUserList, setShowUserList] = useState(true);

  const handleStartDirectChat = async (chatUser: ChatUser) => {
    const channelId = await createDirectChannel(chatUser.id);
    if (channelId) {
      setSelectedChannelId(channelId);
      setSelectedUser(chatUser);
      setShowUserList(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannelId) return;

    await sendMessage(selectedChannelId, newMessage);
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
    if (!showUserList) {
      setShowUserList(true);
      setSelectedUser(null);
      setSelectedChannelId("");
    } else {
      onClose();
    }
  };

  // User list view
  if (showUserList) {
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
            <div className="space-y-2">
              {availableUsers.map((chatUser) => (
                <div
                  key={chatUser.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleStartDirectChat(chatUser)}
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
                        {chatUser.is_online && (
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {availableUsers.length === 0 && (
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
            <p className="text-sm text-muted-foreground">{selectedUser?.role}</p>
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
            <div key={message.id} className={`flex gap-3 ${message.sender_id === user?.id ? "flex-row-reverse" : ""}`}>
              {message.sender_id !== user?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {message.sender?.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex flex-col ${message.sender_id === user?.id ? "items-end" : "items-start"} max-w-[75%]`}>
                {message.sender_id !== user?.id && (
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {message.sender?.full_name || "Onbekende gebruiker"}
                    </p>
                  </div>
                )}
                
                <div className={`p-3 rounded-lg ${
                  message.sender_id === user?.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))}
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
      </div>
    </div>
  );
};