import { useState, useRef } from "react";
import { X, Send, Paperclip, Mic, Image, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useChat, ChatMessage as ChatMessageType } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  onClose: () => void;
}

export const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const { user, profile } = useAuth();
  const { users } = useUsers();
  const { toast } = useToast();
  const {
    channels,
    messages,
    loading,
    selectedChannelId,
    setSelectedChannelId,
    sendMessage,
    createChannel,
  } = useChat();
  
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannelId) return;

    await sendMessage(selectedChannelId, newMessage);
    setNewMessage("");
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    const channelId = await createChannel(
      newChannelName,
      'general',
      undefined,
      selectedParticipants
    );

    if (channelId) {
      setSelectedChannelId(channelId);
      setShowCreateChannel(false);
      setNewChannelName("");
      setSelectedParticipants([]);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
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

  const getUserLanguage = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.role === 'Installateur' ? 'NL' : 'NL'; // Default to NL for now
  };

  if (loading) {
    return (
      <Card className="w-full h-full shadow-xl">
        <CardContent className="flex items-center justify-center h-full">
          <div>Laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full shadow-xl">
      {/* Header */}
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Team Chat</h3>
          {selectedChannel && (
            <Badge variant="default">
              {selectedChannel.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuw Kanaal Maken</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="channel-name">Kanaal Naam</Label>
                  <Input
                    id="channel-name"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="Bijv. Project Updates"
                  />
                </div>
                <div>
                  <Label>Deelnemers</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {users
                      .filter(u => u.id !== user?.id)
                      .map((user) => (
                        <label key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants(prev => [...prev, user.id]);
                              } else {
                                setSelectedParticipants(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                          />
                          <span className="text-sm">{user.full_name || user.email}</span>
                        </label>
                      ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateChannel} disabled={!newChannelName.trim()}>
                    Kanaal Maken
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateChannel(false)}>
                    Annuleren
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex h-[calc(100%-80px)]">
        {/* Channel List */}
        <div className="w-1/3 border-r">
          <ScrollArea className="h-full">
            <div className="p-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`p-3 cursor-pointer rounded-lg hover:bg-gray-50 ${
                    selectedChannelId === channel.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedChannelId(channel.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{channel.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{channel.type}</p>
                    </div>
                    {(channel.unread_count || 0) > 0 && (
                      <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                        {channel.unread_count! > 9 ? '9+' : channel.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {channels.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">Geen kanalen beschikbaar</p>
                  <p className="text-xs mt-1">Maak een nieuw kanaal aan</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannelId ? (
            <>
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
                      
                      <div className={`flex flex-col ${message.sender_id === user?.id ? "items-end" : "items-start"} max-w-xs`}>
                        {message.sender_id !== user?.id && (
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-medium text-gray-700">
                              {message.sender?.full_name || "Onbekende gebruiker"}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {getUserLanguage(message.sender_id)}
                            </Badge>
                          </div>
                        )}
                        
                        <div className={`p-3 rounded-lg ${
                          message.sender_id === user?.id 
                            ? "bg-blue-500 text-white" 
                            : "bg-white border"
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          {message.translated_content && Object.keys(message.translated_content).length > 0 && (
                            <div className="border-t pt-1 mt-2">
                              <Badge variant="outline" className="mb-1 text-xs">
                                Vertaald
                              </Badge>
                              <p className="text-sm italic opacity-75">
                                {Object.values(message.translated_content)[0]}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2 mb-2">
                  <Button variant="ghost" size="sm" onClick={handleFileUpload}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleFileUpload}>
                    <Image className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isRecording ? "text-red-500" : ""}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type je bericht..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>Selecteer een kanaal om te chatten</p>
                <p className="text-sm mt-1">Of maak een nieuw kanaal aan</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};