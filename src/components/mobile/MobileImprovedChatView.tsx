import React, { useState, useRef } from 'react';
import { ArrowLeft, Send, Users, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChat, ChatUser } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MobileImprovedChatViewProps {
  onBack: () => void;
}

export const MobileImprovedChatView: React.FC<MobileImprovedChatViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    channels,
    messages,
    selectedChannelId,
    setSelectedChannelId,
    sendMessage,
    createDirectChannel,
    availableUsers,
  } = useChat();
  
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("channels");
  const [showChannelList, setShowChannelList] = useState(true);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);
  
  // Separate channels by type
  const projectChannels = channels.filter(c => c.type === 'project');
  const generalChannels = channels.filter(c => c.type === 'general');
  const directChannels = channels.filter(c => c.type === 'direct' || c.is_direct_message);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannelId) return;

    await sendMessage(selectedChannelId, newMessage);
    setNewMessage("");
  };

  const handleStartDirectChat = async (userId: string) => {
    const channelId = await createDirectChannel(userId);
    if (channelId) {
      setSelectedChannelId(channelId);
      setShowChannelList(false);
      setActiveTab("channels");
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowChannelList(false);
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

  if (showChannelList) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Chat</h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="channels">
              <MessageSquare className="h-4 w-4 mr-2" />
              Kanalen
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Personen
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="channels" className="flex-1 mt-4">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4">
                {/* Project Channels */}
                {projectChannels.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">PROJECT KANALEN</h3>
                    <div className="space-y-1">
                      {projectChannels.map((channel) => (
                        <div
                          key={channel.id}
                          className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer"
                          onClick={() => handleSelectChannel(channel.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{channel.name}</p>
                              <p className="text-sm text-muted-foreground">Project</p>
                            </div>
                            {(channel.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {channel.unread_count! > 9 ? '9+' : channel.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Messages */}
                {directChannels.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">DIRECTE BERICHTEN</h3>
                    <div className="space-y-1">
                      {directChannels.map((channel) => (
                        <div
                          key={channel.id}
                          className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer"
                          onClick={() => handleSelectChannel(channel.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{channel.name}</p>
                              <p className="text-sm text-muted-foreground">Directe chat</p>
                            </div>
                            {(channel.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {channel.unread_count! > 9 ? '9+' : channel.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Channels */}
                {generalChannels.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">ALGEMENE KANALEN</h3>
                    <div className="space-y-1">
                      {generalChannels.map((channel) => (
                        <div
                          key={channel.id}
                          className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer"
                          onClick={() => handleSelectChannel(channel.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{channel.name}</p>
                              <p className="text-sm text-muted-foreground">Algemeen</p>
                            </div>
                            {(channel.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {channel.unread_count! > 9 ? '9+' : channel.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="users" className="flex-1 mt-4">
            <ScrollArea className="h-full px-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">BESCHIKBARE PERSONEN</h3>
                <div className="space-y-1">
                  {availableUsers.map((chatUser) => (
                    <div
                      key={chatUser.id}
                      className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer"
                      onClick={() => handleStartDirectChat(chatUser.id)}
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
                            <Badge variant="secondary" className="text-xs">
                              {chatUser.role}
                            </Badge>
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
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Chat View
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setShowChannelList(true)} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {selectedChannel?.name || "Chat"}
            </h1>
            {selectedChannel?.is_direct_message && (
              <p className="text-sm text-muted-foreground">Directe chat</p>
            )}
          </div>
        </div>
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
      <div className="p-4 border-t">
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