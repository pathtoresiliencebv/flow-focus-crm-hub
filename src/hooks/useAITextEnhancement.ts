import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAITextEnhancement = () => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const enhanceText = async (text: string, context: 'product' | 'textblock' = 'textblock'): Promise<string> => {
    if (!text.trim()) {
      toast({
        title: "Geen tekst",
        description: "Er is geen tekst om te verbeteren.",
        variant: "destructive",
      });
      return text;
    }

    setIsEnhancing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-text-enhancement', {
        body: { text: text.trim(), context }
      });

      if (error) {
        throw error;
      }

      if (data?.enhancedText) {
        toast({
          title: "Tekst verbeterd",
          description: "De tekst is succesvol verbeterd door AI.",
        });
        return data.enhancedText;
      }

      return text;
    } catch (error) {
      console.error('AI Enhancement error:', error);
      toast({
        title: "Verbetering mislukt",
        description: "Kon de tekst niet verbeteren. Probeer het opnieuw.",
        variant: "destructive",
      });
      return text;
    } finally {
      setIsEnhancing(false);
    }
  };

  return {
    enhanceText,
    isEnhancing
  };
};