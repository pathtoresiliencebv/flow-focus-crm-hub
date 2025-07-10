import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  Bold, 
  Italic, 
  AtSign,
  Hash,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ChatInputEnhancedProps {
  onSendMessage: (content: string, type: 'text' | 'voice' | 'file') => void;
  onTyping: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  showSmartReplies?: boolean;
  enableVoiceInput?: boolean;
  enableFileUpload?: boolean;
  onFileUpload?: (files: FileList) => void;
  onVoiceRecord?: () => void;
  isRecording?: boolean;
}

export const ChatInputEnhanced: React.FC<ChatInputEnhancedProps> = ({
  onSendMessage,
  onTyping,
  placeholder = "Type your message...",
  disabled = false,
  showSmartReplies = true,
  enableVoiceInput = true,
  enableFileUpload = true,
  onFileUpload,
  onVoiceRecord,
  isRecording = false
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMessageChange = useCallback((value: string) => {
    setMessage(value);
    
    // Handle typing indicators
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      onTyping(true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  }, [isTyping, onTyping]);

  const handleSend = useCallback(() => {
    if (!message.trim() || disabled) return;
    
    onSendMessage(message.trim(), 'text');
    setMessage('');
    setIsTyping(false);
    onTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [message, disabled, onSendMessage, onTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && onFileUpload) {
      onFileUpload(files);
    }
  }, [onFileUpload]);

  const insertEmoji = useCallback((emoji: string) => {
    const newMessage = message + emoji;
    setMessage(newMessage);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  }, [message]);

  const commonEmojis = ['😀', '😂', '❤️', '👍', '👎', '😍', '🤔', '😢', '😎', '🎉'];

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        {/* File Upload */}
        {enableFileUpload && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0"
              onClick={handleFileSelect}
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              multiple
            />
          </>
        )}
        
        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-32 resize-none pr-20"
            rows={1}
          />
          
          {/* Input Actions */}
          <div className="absolute right-2 top-2 flex items-center gap-1">
            {/* Emoji Picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={disabled}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" side="top">
                <div className="grid grid-cols-5 gap-2">
                  {commonEmojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Mention Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={disabled}
              onClick={() => insertEmoji('@')}
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Voice Input */}
        {enableVoiceInput && (
          <Button
            type="button"
            variant={isRecording ? "destructive" : "ghost"}
            size="sm"
            className={cn(
              "h-10 w-10 p-0",
              isRecording && "animate-pulse"
            )}
            onClick={onVoiceRecord}
            disabled={disabled}
          >
            {isRecording ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className="h-10 w-10 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Typing Indicator */}
      {isTyping && (
        <div className="mt-2 text-xs text-muted-foreground px-2">
          Typing...
        </div>
      )}
    </div>
  );
};