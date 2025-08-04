import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Paperclip, Mic, Camera, Plus, MapPin, Settings, Globe } from "lucide-react";
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
import { useDirectChat } from "@/hooks/useDirectChat";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { useChatFileUpload } from "@/hooks/useChatFileUpload";
import { enhancedTranslationService } from "@/services/enhancedTranslationService";
import { CameraCapture } from "./CameraCapture";
import { VoiceRecorder } from "./VoiceRecorder";
import { LocationShare } from "./LocationShare";

interface DirectChatWindowProps {
  onClose?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

export const DirectChatWindow = ({ onClose, isFullscreen = false, className = "" }: DirectChatWindowProps) => {
  const { user, profile } = useAuth();
  const { users } = useUsers();
  const { toast } = useToast();
  const { userLanguage, supportedLanguages, updateUserLanguage } = useLanguageDetection();
  const { uploadFile, getFileIcon, formatFileSize } = useChatFileUpload();
  
  const {
    conversations,
    messages,
    loading,
    selectedUserId,
    setSelectedUserId,
    sendMessage,
    markAsRead,
  } = useDirectChat();

  const [newMessage, setNewMessage] = useState("");
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showLocationShare, setShowLocationShare] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Map<string, string>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get available users based on role
  const availableUsers = users.filter(u => {
    if (!user || u.id === user.id) return false;
    
    // Admin can chat with everyone
    if (profile?.role === 'Administrator' || profile?.role === 'Administratie') {
      return true;
    }
    
    // Monteurs can only chat with admin/administratie
    if (profile?.role === 'Monteur') {
      return u.role === 'Administrator' || u.role === 'Administratie';
    }
    
    return false;
  });

  const selectedUser = users.find(u => u.id === selectedUserId);
  const currentConversation = conversations.find(c => c.other_user_id === selectedUserId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedUserId && currentConversation?.unread_count > 0) {
      markAsRead(selectedUserId);
    }
  }, [selectedUserId, currentConversation?.unread_count, markAsRead]);

  const handleSendMessage = useCallback(async (content: string, messageType: string = 'text', fileData?: any, locationData?: any) => {
    if (!selectedUserId || (!content.trim() && messageType === 'text' && !fileData && !locationData)) return;

    try {
      await sendMessage(selectedUserId, content, messageType, fileData, locationData);
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Kon bericht niet verzenden",
        variant: "destructive"
      });
    }
  }, [selectedUserId, sendMessage, toast]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!user?.id || !selectedUserId) return;

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
        description: "Kon bestand niet uploaden",
        variant: "destructive"
      });
    }
  }, [user?.id, selectedUserId, uploadFile, handleSendMessage, toast]);

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
      setShowCameraCapture(false);
    } catch (error) {
      console.error('Camera capture error:', error);
      toast({
        title: "Camera Error",
        description: "Kon foto niet verwerken",
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
    setShowVoiceRecorder(false);
  }, [handleSendMessage]);

  const handleLocationShare = useCallback(async (location: { latitude: number; longitude: number; address?: string }) => {
    await handleSendMessage(
      `📍 Locatie gedeeld${location.address ? `\n${location.address}` : ''}`,
      'location',
      undefined,
      {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      }
    );
    setShowLocationShare(false);
  }, [handleSendMessage]);

  const translateMessage = useCallback(async (message: any) => {
    if (!message.content || translatedMessages.has(message.id)) return;

    try {
      const fromLang = message.detected_language || 'nl';
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
      <Card className={`${isFullscreen ? 'w-full h-screen' : 'w-full h-full'} shadow-xl ${className}`}>
        {/* Header */}
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">Team Chat</h3>
            {selectedUser && (
              <Badge variant="default">
                {selectedUser.full_name || selectedUser.email}
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
            
            {/* Close button */}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 flex h-[calc(100%-80px)]">
          {/* User List */}
          <div className={`${isFullscreen ? 'w-1/4 min-w-64' : 'w-1/3'} border-r`}>
            <ScrollArea className="h-full">
              <div className="p-2">
                {availableUsers.map((user) => {
                  const conversation = conversations.find(c => c.other_user_id === user.id);
                  return (
                    <div
                      key={user.id}
                      className={`p-3 cursor-pointer rounded-lg hover:bg-accent ${
                        selectedUserId === user.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.full_name?.split(" ").map(n => n[0]).join("") || user.email.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                            {conversation?.last_message && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {conversation.last_message.substring(0, 30)}...
                              </p>
                            )}
                          </div>
                        </div>
                        {conversation && conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {availableUsers.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">Geen gebruikers beschikbaar</p>
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
            {selectedUserId ? (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex gap-3 ${message.sender_id === user?.id ? "flex-row-reverse" : ""}`}>
                        {message.sender_id !== user?.id && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {selectedUser?.full_name?.split(" ").map(n => n[0]).join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`flex flex-col ${message.sender_id === user?.id ? "items-end" : "items-start"} ${isFullscreen ? 'max-w-lg' : 'max-w-xs'}`}>
                          {message.sender_id !== user?.id && (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {selectedUser?.full_name || "Onbekende gebruiker"}
                              </p>
                              {message.detected_language && (
                                <Badge variant="outline" className="text-xs">
                                  {message.detected_language.toUpperCase()}
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
                                {message.message_type === 'image' ? (
                                  <img 
                                    src={message.thumbnail_url || message.file_url} 
                                    alt={message.file_name || 'Image'}
                                    className={`${isFullscreen ? 'max-w-md' : 'max-w-xs'} rounded cursor-pointer`}
                                    onClick={() => window.open(message.file_url!, '_blank')}
                                  />
                                ) : message.message_type === 'voice' ? (
                                  <div className="flex items-center gap-2 p-2 bg-background rounded border">
                                    <Mic className="h-4 w-4" />
                                    <audio controls className="max-w-xs">
                                      <source src={message.file_url} type="audio/webm" />
                                    </audio>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-2 bg-background rounded border">
                                    <span className="text-lg">{getFileIcon(message.file_type || '')}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{message.file_name}</p>
                                      {message.file_size && (
                                        <p className="text-xs text-muted-foreground">{formatFileSize(message.file_size)}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Location Content */}
                            {message.message_type === 'location' && message.latitude && message.longitude && (
                              <div className="mb-2">
                                <div className="flex items-center gap-2 p-2 bg-background rounded border">
                                  <MapPin className="h-4 w-4" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Locatie</p>
                                    {message.address && (
                                      <p className="text-xs text-muted-foreground">{message.address}</p>
                                    )}
                                    <a 
                                      href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 hover:underline"
                                    >
                                      Bekijk op kaart
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Text Content */}
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Translation */}
                            {message.detected_language && message.detected_language !== userLanguage && (
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
                    <div ref={messagesEndRef} />
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
                      accept="image/*,.pdf,.doc,.docx,audio/*,video/*"
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
                          Bestand/PDF uploaden
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowCameraCapture(true)}>
                          <Camera className="h-4 w-4 mr-2" />
                          Foto maken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowVoiceRecorder(true)}>
                          <Mic className="h-4 w-4 mr-2" />
                          Spraakbericht
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowLocationShare(true)}>
                          <MapPin className="h-4 w-4 mr-2" />
                          Locatie delen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type je bericht..."
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
                  <p>Selecteer een persoon om te chatten</p>
                  <p className="text-sm mt-1">
                    {profile?.role === 'Administrator' || profile?.role === 'Administratie' 
                      ? 'Je kunt met alle team leden chatten' 
                      : 'Je kunt alleen met de administratie chatten'
                    }
                  </p>
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

      {/* Location Share Modal */}
      <LocationShare
        isOpen={showLocationShare}
        onClose={() => setShowLocationShare(false)}
        onLocationShare={handleLocationShare}
      />
    </>
  );
};