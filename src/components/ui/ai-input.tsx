import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Input } from './input';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAI, AIContextType } from '@/hooks/useAI';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

interface AIInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: AIContextType;
  context?: string;
  className?: string;
  multiline?: boolean;
  aiPrompt?: string;
  disabled?: boolean;
}

export const AIInput: React.FC<AIInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'general',
  context,
  className,
  multiline = false,
  aiPrompt,
  disabled = false
}) => {
  const { generateAI, generateSuggestions, loading } = useAI();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Generate suggestions on value change
  useEffect(() => {
    if (value && value.length > 10) {
      const timeoutId = setTimeout(async () => {
        const newSuggestions = await generateSuggestions(value, type, context);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
      }, 1000);

      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, type, context, generateSuggestions]);

  const handleAIGenerate = async (prompt?: string) => {
    const finalPrompt = prompt || customPrompt || aiPrompt || `Genereer tekst voor ${type}`;
    const fullPrompt = value ? `${finalPrompt}. Huidige tekst: "${value}"` : finalPrompt;
    
    const result = await generateAI(fullPrompt, type, context);
    if (result) {
      onChange(value ? `${value}\n\n${result}` : result);
      setAiOpen(false);
      setCustomPrompt('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="relative">
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pr-10", className)}
          disabled={disabled}
          rows={multiline ? 4 : undefined}
        />
        
        <Popover open={aiOpen} onOpenChange={setAiOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-primary/10"
              disabled={loading || disabled}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">AI Assistent</h4>
                <Textarea
                  placeholder="Beschrijf wat je wilt genereren..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAIGenerate()}
                  disabled={!customPrompt.trim() && !aiPrompt}
                  className="flex-1"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Genereren
                </Button>
                {aiPrompt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAIGenerate(aiPrompt)}
                    className="flex-1"
                  >
                    Standaard
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
          <div className="p-2 border-b">
            <span className="text-xs text-muted-foreground">AI Suggesties</span>
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left p-2 hover:bg-muted text-sm border-b last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};