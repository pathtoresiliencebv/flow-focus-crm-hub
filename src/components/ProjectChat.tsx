import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Paperclip, 
  Mic, 
  Search, 
  Users, 
  MoreVertical,
  Download,
  Play,
  Pause,
  Image as ImageIcon
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProjectChatProps {
  projectId: string;
  projectTitle: string;
}

interface ChatUser {
  id: string;
  full_name?: string;
  role?: string;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ projectId, projectTitle }) => {
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

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      await sendMessage(selectedChannelId, messageInput);
      setMessageInput('');
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon bericht niet versturen",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannelId) return;

    setUploadingFile(true);
    try {
      // TODO: Implement file upload to Supabase Storage
      // For now, just send a message indicating file upload
      await sendMessage(
        selectedChannelId, 
        `📎 Bestand gedeeld: ${file.name}`,
        'file',
        undefined,
        file.name
      );
      
      toast({
        title: "Bestand gedeeld",
        description: `${file.name} is gedeeld in de chat`,
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Kon bestand niet uploaden",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
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
      // TODO: Upload voice recording to Supabase Storage
      // For now, just send a message indicating voice message
      await sendMessage(
        selectedChannelId,
        "🎤 Spraakbericht",
        'voice'
      );
      
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
      <div key={message.id} className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
        {!isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {sender?.full_name ? sender.full_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs`}>
          {!isOwnMessage && sender?.full_name && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">{sender.full_name}</span>
              {sender.role && (
                <Badge variant="secondary" className="text-xs">
                  {sender.role}
                </Badge>
              )}
            </div>
          )}
          
          <Card className={`${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'} shadow-sm`}>
            <CardContent className="p-3">
              {message.message_type === 'voice' ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Play className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full w-1/3"></div>
                  </div>
                  <span className="text-xs">0:15</span>
                </div>
              ) : message.message_type === 'file' ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{message.file_name || 'Bestand'}</p>
                    <p className="text-xs opacity-70">Klik om te downloaden</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ) : message.message_type === 'image' ? (
                <div className="space-y-2">
                  <div className="bg-muted rounded-lg p-2 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  {message.content && (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}
            </CardContent>
          </Card>
          
          <span className="text-xs text-muted-foreground mt-1">
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Chat wordt geladen...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Project Chat</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {projectChannel ? 'Actief' : 'Aan het laden...'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Deelnemers bekijken
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek in berichten..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </CardHeader>
      
      <Separator />
      
      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Nog geen berichten in deze chat</p>
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
      </CardContent>
      
      <Separator />
      
      {/* Input Area */}
      <CardContent className="p-4">
        {recordingBlob && (
          <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Spraakbericht opgenomen</span>
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
        
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Input
              placeholder="Typ je bericht..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!selectedChannelId}
            />
            
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
              disabled={uploadingFile || !selectedChannelId}
              className="h-9 w-9 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              disabled={!selectedChannelId}
              className={`h-9 w-9 p-0 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || !selectedChannelId}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};