import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Mic, Camera, Paperclip, Plus, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { useChatFileUpload } from "@/hooks/useChatFileUpload";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { MobileChatChannelList } from "./MobileChatChannelList";
import { MobileChatMessages } from "./MobileChatMessages";
import { MobileChatInput } from "./MobileChatInput";
import { MobileLanguageSettings } from "./MobileLanguageSettings";

interface MobileEnhancedChatViewProps {
  onBack: () => void;
}

export const MobileEnhancedChatView: React.FC<MobileEnhancedChatViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userLanguage, supportedLanguages, updateUserLanguage } = useLanguageDetection();
  const { uploadFile } = useChatFileUpload();
  const { isNativeApp, takePicture, hapticFeedback } = useNativeCapabilities();
  
  const {
    channels,
    messages,
    selectedChannelId,
    setSelectedChannelId,
    sendMessage,
    createChannel,
  } = useChat();
  
  const [showChannelList, setShowChannelList] = useState(true);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  const handleSendMessage = useCallback(async (content: string, messageType: string = 'text', fileData?: any) => {
    if (!selectedChannelId || (!content.trim() && messageType === 'text')) return;

    try {
      // Haptic feedback for native apps
      if (isNativeApp) {
        await hapticFeedback();
      }

      await sendMessage(selectedChannelId, content);
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fout",
        description: "Kon bericht niet verzenden",
        variant: "destructive"
      });
    }
  }, [selectedChannelId, sendMessage, toast, isNativeApp, hapticFeedback]);

  const handleSelectChannel = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
    setShowChannelList(false);
  }, [setSelectedChannelId]);

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

      if (isNativeApp) {
        await hapticFeedback();
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Fout",
        description: "Kon bestand niet uploaden",
        variant: "destructive"
      });
    }
  }, [user?.id, selectedChannelId, uploadFile, handleSendMessage, toast, isNativeApp, hapticFeedback]);

  const handleCameraCapture = useCallback(async () => {
    if (!isNativeApp) {
      toast({
        title: "Camera niet beschikbaar",
        description: "Camera is alleen beschikbaar in de mobiele app",
        variant: "destructive"
      });
      return;
    }

    try {
      await hapticFeedback();
      const result = await takePicture({
        allowEditing: true,
      });

      if (result && user?.id) {
        // Convert dataUrl to File
        const response = await fetch(result.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo_${Date.now()}.${result.format}`, { type: `image/${result.format}` });
        
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
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      toast({
        title: "Camera Fout",
        description: "Kon geen foto maken",
        variant: "destructive"
      });
    }
  }, [isNativeApp, takePicture, hapticFeedback, user?.id, uploadFile, handleSendMessage, toast]);

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

  if (showChannelList) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Enhanced Chat</h1>
            <Badge variant="secondary" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              {supportedLanguages.find(l => l.code === userLanguage)?.name}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLanguageSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Channel List */}
        <MobileChatChannelList
          channels={channels}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={createChannel}
        />

        {/* Language Settings Dialog */}
        <MobileLanguageSettings
          isOpen={showLanguageSettings}
          onClose={() => setShowLanguageSettings(false)}
          currentLanguage={userLanguage}
          supportedLanguages={supportedLanguages}
          onLanguageChange={updateUserLanguage}
        />
      </div>
    );
  }

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
        <Badge variant="secondary" className="text-xs">
          <Globe className="h-3 w-3 mr-1" />
          {supportedLanguages.find(l => l.code === userLanguage)?.name}
        </Badge>
      </div>

      {/* Messages */}
      <MobileChatMessages
        messages={messages}
        currentUserId={user?.id}
        userLanguage={userLanguage}
      />

      {/* Input Area */}
      <MobileChatInput
        value={newMessage}
        onChange={setNewMessage}
        onSend={() => handleSendMessage(newMessage)}
        onFileUpload={handleFileUpload}
        onCameraCapture={handleCameraCapture}
        onVoiceMessage={handleVoiceMessage}
        fileInputRef={fileInputRef}
        isNativeApp={isNativeApp}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
};