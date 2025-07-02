import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Paperclip, 
  Mic, 
  Camera,
  ArrowLeft,
  MoreVertical,
  Search
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useOfflineChat } from "@/hooks/useOfflineChat";
import { useVoiceToText } from "@/hooks/useVoiceToText";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface MobileChatViewProps {
  projectId: string;
  projectTitle: string;
  onBack?: () => void;
}

export const MobileChatView: React.FC<MobileChatViewProps> = ({ 
  projectId, 
  projectTitle, 
  onBack 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    channels,
    messages,
    selectedChannelId,
    setSelectedChannelId,
    sendMessage,
    createChannel,
    loading
  } = useChat();
  
  const { 
    isOnline, 
    pendingSync, 
    addOfflineMessage 
  } = useOfflineChat();
  
  const { 
    transcribeAudio, 
    isTranscribing 
  } = useVoiceToText();

  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find or create project channel
  const projectChannel = channels.find(c => c.type === 'project' && c.project_id === projectId);

  // Auto-create project channel if it doesn't exist
  useEffect(() => {
    if (!loading && !projectChannel && user) {
      const channelName = `Project: ${projectTitle}`;
      createChannel(channelName, 'project', projectId, []);
    }
  }, [loading, projectChannel, user, projectId, projectTitle, createChannel]);

  // Set selected channel when project channel is available
  useEffect(() => {
    if (projectChannel && selectedChannelId !== projectChannel.id) {
      setSelectedChannelId(projectChannel.id);
    }
  }, [projectChannel, selectedChannelId, setSelectedChannelId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannelId) return;

    try {
      if (isOnline) {
        await sendMessage(selectedChannelId, messageInput);
      } else {
        await addOfflineMessage(selectedChannelId, messageInput, 'text');
        toast({
          title: "Bericht opgeslagen",
          description: "Bericht wordt verzonden zodra je online bent",
        });
      }
      setMessageInput('');
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannelId) return;

    try {
      // For images, send as image type
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      
      await sendMessage(
        selectedChannelId, 
        `📎 ${file.name}`,
        messageType,
        undefined,
        file.name
      );
      
      toast({
        title: "Bestand gedeeld",
        description: `${file.name} is gedeeld`,
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon bestand niet uploaden",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordingBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon microfoon niet openen",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async () => {
    if (!recordingBlob || !selectedChannelId) return;

    try {
      // Try to transcribe audio to text
      const transcribedText = await transcribeAudio(recordingBlob);
      const content = transcribedText || "🎤 Spraakbericht";
      
      if (isOnline) {
        await sendMessage(selectedChannelId, content, 'voice');
      } else {
        await addOfflineMessage(selectedChannelId, content, 'voice');
        toast({
          title: "Spraakbericht opgeslagen",
          description: "Wordt verzonden zodra je online bent",
        });
      }
      
      setRecordingBlob(null);
      toast({
        title: "Spraakbericht verzonden",
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon spraakbericht niet versturen",
        variant: "destructive",
      });
    }
  };

  const filteredMessages = messages.filter(msg =>
    searchQuery === '' || 
    msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: nl 
    });
  };

  const renderMessage = (message: any) => {
    const isOwnMessage = message.sender_id === user?.id;
    const sender = message.sender;

    return (
      <div key={message.id} className={`flex gap-2 mb-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
        {!isOwnMessage && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {sender?.full_name ? sender.full_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
          {!isOwnMessage && sender?.full_name && (
            <span className="text-xs font-medium text-muted-foreground mb-1">{sender.full_name}</span>
          )}
          
          <div className={`rounded-2xl px-3 py-2 ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            {message.message_type === 'voice' ? (
              <div className="flex items-center gap-2 min-w-[120px]">
                <div className="h-6 w-6 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                  <Mic className="h-3 w-3" />
                </div>
                <div className="flex-1 h-1 bg-muted-foreground/30 rounded-full">
                  <div className="h-1 bg-current rounded-full w-1/3"></div>
                </div>
                <span className="text-xs">0:15</span>
              </div>
            ) : message.message_type === 'file' || message.message_type === 'image' ? (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-muted-foreground/20 flex items-center justify-center">
                  {message.message_type === 'image' ? (
                    <Camera className="h-3 w-3" />
                  ) : (
                    <Paperclip className="h-3 w-3" />
                  )}
                </div>
                <span className="text-xs">{message.file_name || 'Bestand'}</span>
              </div>
            ) : (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
          
          <span className="text-xs text-muted-foreground mt-1">
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Chat wordt geladen...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-background border-b p-4 flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">Project Chat</h2>
            {!isOnline && (
              <div className="h-2 w-2 bg-yellow-500 rounded-full" title="Offline" />
            )}
            {pendingSync && (
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" title="Synchronizing..." />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{projectTitle}</p>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowSearch(!showSearch)}
          className="h-8 w-8 p-0"
        >
          <Search className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-3 border-b">
          <Input
            placeholder="Zoek in berichten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      )}
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">Nog geen berichten</p>
              <p className="text-xs mt-1">Start het gesprek!</p>
            </div>
          </div>
        ) : (
          <>
            {filteredMessages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>
      
      {/* Voice Recording Preview */}
      {recordingBlob && (
        <div className="mx-3 mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Opname klaar</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setRecordingBlob(null)}>
              Annuleren
            </Button>
            <Button size="sm" onClick={sendVoiceMessage}>
              Versturen
            </Button>
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <div className="p-3 border-t bg-background">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedChannelId}
            className="h-8 w-8 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = "image/*";
                fileInputRef.current.click();
              }
            }}
            disabled={!selectedChannelId}
            className="h-8 w-8 p-0"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              placeholder="Typ je bericht..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!selectedChannelId}
              className="h-8 rounded-full"
            />
          </div>
          
          {messageInput.trim() ? (
            <Button 
              onClick={handleSendMessage}
              disabled={!selectedChannelId}
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              disabled={!selectedChannelId || isTranscribing}
              className={`h-8 w-8 p-0 rounded-full ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
            >
              <Mic className={`h-4 w-4 ${isTranscribing ? 'animate-pulse' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};