import React, { useState, useCallback } from 'react';
import { Send, Paperclip, Camera, Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";

interface MobileChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (files: FileList) => void;
  onCameraCapture: () => void;
  onVoiceMessage: (audioUrl: string, transcription: string, duration: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isNativeApp: boolean;
}

export const MobileChatInput: React.FC<MobileChatInputProps> = ({
  value,
  onChange,
  onSend,
  onFileUpload,
  onCameraCapture,
  onVoiceMessage,
  fileInputRef,
  isNativeApp
}) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleVoiceMessage = useCallback((audioUrl: string, transcription: string, duration: number) => {
    onVoiceMessage(audioUrl, transcription, duration);
    setShowVoiceRecorder(false);
  }, [onVoiceMessage]);

  return (
    <>
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2 items-end">
          {/* Attachment Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-10 p-0 flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleFileClick}>
                <Paperclip className="h-4 w-4 mr-2" />
                Bestand kiezen
              </DropdownMenuItem>
              {isNativeApp && (
                <DropdownMenuItem onClick={onCameraCapture}>
                  <Camera className="h-4 w-4 mr-2" />
                  Foto maken
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowVoiceRecorder(true)}>
                <Mic className="h-4 w-4 mr-2" />
                Spraakbericht
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Message Input */}
          <div className="flex-1 flex gap-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type je bericht..."
              className="flex-1"
            />
            <Button 
              onClick={onSend} 
              disabled={!value.trim()} 
              size="sm"
              className="h-10 w-10 p-0 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions for Native App */}
        {isNativeApp && (
          <div className="flex gap-2 mt-2 justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCameraCapture}
              className="flex-1 h-8"
            >
              <Camera className="h-4 w-4 mr-1" />
              Camera
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceRecorder(true)}
              className="flex-1 h-8"
            >
              <Mic className="h-4 w-4 mr-1" />
              Voice
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileClick}
              className="flex-1 h-8"
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Files
            </Button>
          </div>
        )}
      </div>

      {/* Voice Recorder Dialog */}
      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onVoiceMessage={handleVoiceMessage}
      />
    </>
  );
};