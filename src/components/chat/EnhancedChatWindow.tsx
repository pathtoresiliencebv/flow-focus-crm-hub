import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Paperclip, Mic, Image, Plus, Camera, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useChat, ChatMessage as ChatMessageType } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import { useAI } from "@/hooks/useAI";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { useChatFileUpload } from "@/hooks/useChatFileUpload";
import { enhancedTranslationService } from "@/services/enhancedTranslationService";
import { CameraCapture } from "./CameraCapture";
import { VoiceRecorder } from "./VoiceRecorder";

interface EnhancedChatWindowProps {
  onClose: () => void;
}

export const EnhancedChatWindow = ({ onClose }: EnhancedChatWindowProps) => {
  const { user, profile } = useAuth();
  const { users } = useUsers();
  const { toast } = useToast();
  const { generateAI } = useAI();
  const { userLanguage, supportedLanguages, updateUserLanguage, detectContentLanguage } = useLanguageDetection();
  const { uploadFile, getFileIcon, formatFileSize } = useChatFileUpload();
  
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
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [aiChannelId, setAiChannelId] = useState<string | null>(null);
  const [translatedMessages, setTranslatedMessages] = useState<Map<string, string>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  // Auto-create AI Assistant channel if it doesn't exist
  useEffect(() => {
    if (!loading && user && channels.length > 0) {
      const aiChannel = channels.find(c => c.name.toLowerCase().includes('ai assistant'));
      if (!aiChannel) {
        createChannel('AI Assistant', 'general', undefined, []);
      } else {
        setAiChannelId(aiChannel.id);
      }
    }
  }, [loading, user, channels, createChannel]);

  // Enhanced message sending with language detection and translation
  const handleSendMessage = useCallback(async (content: string, messageType: string = 'text', fileData?: any) => {
    if (!selectedChannelId || (!content.trim() && messageType === 'text')) return;

    try {
      // Check if this is a message to AI
      if (selectedChannelId === aiChannelId && content.startsWith('/ai ')) {
        const aiPrompt = content.slice(4);
        const aiResponse = await generateAI(aiPrompt, 'chat');
        
        if (aiResponse) {
          await sendMessage(selectedChannelId, content);
          setTimeout(async () => {
            await sendMessage(selectedChannelId, `🤖 AI Assistant: ${aiResponse}`);
          }, 500);
        }
      } else {
        await sendMessage(selectedChannelId, content);
      }
      
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive"
      });
    }
  }, [selectedChannelId, aiChannelId, detectContentLanguage, generateAI, sendMessage, toast]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!user?.id || !selectedChannelId) return;

    try {
      const file = files[0];
      const uploadResult = await uploadFile(file, user.id);
      
      await handleSendMessage(
        `📎 ${uploadResult.fileName}`,
        file.type.startsWith('image/') ? 'image' : 'file',
        {
          file_url: uploadResult.url,
          file_name: uploadResult.fileName,
          file_size: uploadResult.fileSize,
          file_type: uploadResult.fileType,
          thumbnail_url: uploadResult.thumbnailUrl
        }
      );
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Error",
        description: "Could not upload file",
        variant: "destructive"
      });
    }
  }, [user?.id, selectedChannelId, uploadFile, handleSendMessage, toast]);

  const handleCameraCapture = useCallback(async (file: File) => {
    if (!user?.id) return;
    
    try {
      const uploadResult = await uploadFile(file, user.id);
      await handleSendMessage(
        "📸 Foto",
        'image',
        {
          file_url: uploadResult.url,
          file_name: uploadResult.fileName,
          file_size: uploadResult.fileSize,
          file_type: uploadResult.fileType,
          thumbnail_url: uploadResult.thumbnailUrl
        }
      );
    } catch (error) {
      console.error('Camera capture error:', error);
      toast({
        title: "Camera Error",
        description: "Could not process captured image",
        variant: "destructive"
      });
    }
  }, [user?.id, uploadFile, handleSendMessage, toast]);

  const handleVoiceMessage = useCallback(async (audioUrl: string, transcription: string, duration: number) => {
    await handleSendMessage(
      `🎵 Spraakbericht (${Math.round(duration)}s)${transcription ? `\n"${transcription}"` : ''}`,
      'voice',
      {
        file_url: audioUrl,
        file_name: `voice_${Date.now()}.webm`,
        audio_duration: duration,
        transcription_text: transcription
      }
    );
  }, [handleSendMessage]);

  const translateMessage = useCallback(async (message: ChatMessageType) => {
    if (!message.content || translatedMessages.has(message.id)) return;

    try {
      const fromLang = (message as any).detected_language || 'nl';
      const toLang = userLanguage;
      
      if (fromLang === toLang) return;

      const result = await enhancedTranslationService.translateText({
        text: message.content,
        fromLanguage: fromLang,
        toLanguage: toLang,
        context: 'casual'
      });

      setTranslatedMessages(prev => new Map(prev).set(message.id, result.translatedText));
    } catch (error) {
      console.error('Translation error:', error);
    }
  }, [userLanguage, translatedMessages]);

  const handleCreateChannel = useCallback(async () => {
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
      
      if (newChannelName.toLowerCase().includes('ai assistant')) {
        setAiChannelId(channelId);
      }
    }
  }, [newChannelName, selectedParticipants, createChannel, setSelectedChannelId]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(newMessage);
    }
  }, [newMessage, handleSendMessage]);

  const formatTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleTimeString("nl-NL", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

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
    <>
      <Card className="w-full h-full shadow-xl">
        {/* Header */}
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Enhanced Team Chat</h3>
            {selectedChannel && (
              <Badge variant="default">
                {selectedChannel.name}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              {supportedLanguages.find(l => l.code === userLanguage)?.name}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Settings */}
            <Dialog open={showLanguageSettings} onOpenChange={setShowLanguageSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Taal Instellingen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Jouw Taal</Label>
                    <Select value={userLanguage} onValueChange={updateUserLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedLanguages.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Create Channel */}
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
                    className={`p-3 cursor-pointer rounded-lg hover:bg-accent ${
                      selectedChannelId === channel.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedChannelId(channel.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{channel.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{channel.type}</p>
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
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">Geen kanalen beschikbaar</p>
                    <p className="text-xs mt-1">Maak een nieuw kanaal aan</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div 
            className="flex-1 flex flex-col"
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
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
                              <p className="text-xs font-medium text-muted-foreground">
                                {message.sender?.full_name || "Onbekende gebruiker"}
                              </p>
                              {(message as any).detected_language && (
                                <Badge variant="outline" className="text-xs">
                                  {(message as any).detected_language.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className={`p-3 rounded-lg ${
                            message.sender_id === user?.id 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            {/* File/Media Content */}
                            {message.file_url && (
                              <div className="mb-2">
                                {(message as any).message_type === 'image' ? (
                                  <img 
                                    src={(message as any).thumbnail_url || message.file_url} 
                                    alt={message.file_name || 'Image'}
                                    className="max-w-xs rounded cursor-pointer"
                                    onClick={() => window.open(message.file_url!, '_blank')}
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 p-2 bg-background rounded border">
                                    <span className="text-lg">{getFileIcon((message as any).file_type || '')}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{message.file_name}</p>
                                      {(message as any).file_size && (
                                        <p className="text-xs text-muted-foreground">{formatFileSize((message as any).file_size)}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Text Content */}
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Translation */}
                            {(message as any).detected_language && (message as any).detected_language !== userLanguage && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                {translatedMessages.has(message.id) ? (
                                  <div>
                                    <Badge variant="outline" className="mb-1 text-xs">
                                      Vertaald naar {supportedLanguages.find(l => l.code === userLanguage)?.name}
                                    </Badge>
                                    <p className="text-sm italic opacity-75">
                                      {translatedMessages.get(message.id)}
                                    </p>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-6"
                                    onClick={() => translateMessage(message)}
                                  >
                                    <Globe className="h-3 w-3 mr-1" />
                                    Vertalen
                                  </Button>
                                )}
                              </div>
                            )}
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
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex gap-2 mb-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,audio/*"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                          <Paperclip className="h-4 w-4 mr-2" />
                          Bestand uploaden
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowCameraCapture(true)}>
                          <Camera className="h-4 w-4 mr-2" />
                          Foto maken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowVoiceRecorder(true)}>
                          <Mic className="h-4 w-4 mr-2" />
                          Spraakbericht
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        selectedChannelId === aiChannelId 
                          ? "Type '/ai' gevolgd door je vraag voor AI assistance..." 
                          : "Type je bericht..."
                      }
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleSendMessage(newMessage)} 
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>Selecteer een kanaal om te chatten</p>
                  <p className="text-sm mt-1">Of maak een nieuw kanaal aan</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onCapture={handleCameraCapture}
      />

      {/* Voice Recorder Modal */}
      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onVoiceMessage={handleVoiceMessage}
      />
    </>
  );
};