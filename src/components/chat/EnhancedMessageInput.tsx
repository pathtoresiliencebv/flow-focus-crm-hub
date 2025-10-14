import React, { useState, useRef, useCallback } from 'react';
import { MessageInput } from 'stream-chat-react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Camera, Smile } from 'lucide-react';

interface EnhancedMessageInputProps {
  channel: any;
  onSendMessage?: (message: string) => void;
}

export const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({ 
  channel, 
  onSendMessage 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emoji picker data
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
    '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾'
  ];

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Send audio message
        if (channel) {
          await channel.sendFile(audioBlob, 'audio-message.wav', 'audio/wav');
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Microfoon toegang vereist voor spraakberichten');
    }
  }, [channel]);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Handle file upload (camera/photo)
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && channel) {
      channel.sendFile(file, file.name, file.type);
    }
  }, [channel]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    // This will be handled by the Stream Chat MessageInput
    setShowEmojiPicker(false);
  }, []);

  return (
    <div className="p-4 border-t bg-background">
      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="mb-4 p-4 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <div className="grid grid-cols-10 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl hover:bg-accent rounded p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message input area */}
      <div className="flex items-end gap-2">
        {/* File upload button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0"
        >
          <Camera className="h-4 w-4" />
        </Button>

        {/* Voice recording button */}
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="sm"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          className="flex-shrink-0"
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        {/* Emoji picker button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex-shrink-0"
        >
          <Smile className="h-4 w-4" />
        </Button>

        {/* Stream Chat MessageInput */}
        <div className="flex-1">
          <MessageInput />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};