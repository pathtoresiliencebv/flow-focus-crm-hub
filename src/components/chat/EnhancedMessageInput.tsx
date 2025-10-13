import React, { useState, useRef, useCallback } from 'react';
import { MessageInput } from 'stream-chat-react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Camera, Smile, Send, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

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
  const [message, setMessage] = useState('');
  const [translatedMessage, setTranslatedMessage] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { translateText } = useTranslation();

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
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // Auto-translate message
  const handleMessageChange = useCallback(async (value: string) => {
    setMessage(value);
    
    if (value.trim() && translateText) {
      try {
        const translation = await translateText(value, 'en'); // Translate to English
        setTranslatedMessage(translation);
        setShowTranslation(true);
      } catch (error) {
        console.warn('Translation failed:', error);
      }
    } else {
      setShowTranslation(false);
    }
  }, [translateText]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (message.trim() && channel) {
      await channel.sendMessage({
        text: message,
        // Include translation if available
        ...(showTranslation && translatedMessage && {
          custom: {
            translated_text: translatedMessage,
            original_language: 'nl'
          }
        })
      });
      setMessage('');
      setTranslatedMessage('');
      setShowTranslation(false);
    }
  }, [message, channel, showTranslation, translatedMessage]);

  // Handle key press
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="p-4 border-t bg-background">
      {/* Translation preview */}
      {showTranslation && translatedMessage && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-blue-600 mb-1">Vertaald naar Engels:</p>
              <p className="text-sm text-blue-800">{translatedMessage}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranslation(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type je bericht..."
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          size="sm"
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
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
