import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type AIContextType = 'chat' | 'email' | 'project' | 'quote' | 'invoice' | 'general';

interface AIResponse {
  response: string;
  type: AIContextType;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const useAI = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generateAI = useCallback(async (
    prompt: string,
    type: AIContextType = 'general',
    context?: string
  ): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Fout",
        description: "Je moet ingelogd zijn om AI te gebruiken",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          prompt,
          type,
          context,
          stream: false
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse = data as AIResponse;
      return aiResponse.response;
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: "AI Fout",
        description: "Er ging iets mis met de AI generatie",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const generateSuggestions = useCallback(async (
    inputValue: string,
    type: AIContextType,
    context?: string
  ): Promise<string[]> => {
    if (!inputValue || inputValue.length < 3) return [];

    const prompt = `Geef 3 korte suggesties om deze ${type === 'email' ? 'e-mail' : type} tekst te verbeteren of aan te vullen: "${inputValue}"`;
    
    const response = await generateAI(prompt, type, context);
    if (!response) return [];

    // Parse response into suggestions
    return response
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .slice(0, 3);
  }, [generateAI]);

  return {
    generateAI,
    generateSuggestions,
    loading
  };
};