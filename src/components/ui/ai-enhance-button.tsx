import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAITextEnhancement } from '@/hooks/useAITextEnhancement';

interface AIEnhanceButtonProps {
  text: string;
  onEnhanced: (enhancedText: string) => void;
  context?: 'product' | 'textblock';
  size?: 'sm' | 'default';
  variant?: 'outline' | 'ghost' | 'default';
}

export const AIEnhanceButton: React.FC<AIEnhanceButtonProps> = ({
  text,
  onEnhanced,
  context = 'textblock',
  size = 'sm',
  variant = 'outline'
}) => {
  const { enhanceText, isEnhancing } = useAITextEnhancement();

  const handleEnhance = async () => {
    const enhanced = await enhanceText(text, context);
    if (enhanced !== text) {
      onEnhanced(enhanced);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleEnhance}
      disabled={isEnhancing || !text.trim()}
      className="gap-1 h-7 px-2 text-xs"
    >
      {isEnhancing ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      AI
    </Button>
  );
};