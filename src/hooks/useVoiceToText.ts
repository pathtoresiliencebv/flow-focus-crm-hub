import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useVoiceToText = () => {
  const { toast } = useToast();
  const [isTranscribing, setIsTranscribing] = useState(false);

  const transcribeAudio = useCallback(async (audioBlob: Blob, language = 'nl'): Promise<string | null> => {
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      console.log('Sending audio for transcription...');

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: {
          audio: base64Audio,
          language
        }
      });

      if (error) {
        console.error('Voice-to-text error:', error);
        throw error;
      }

      console.log('Transcription successful:', data);
      return data.text || null;

    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Transcriptie fout",
        description: "Kon spraak niet omzetten naar tekst",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [toast]);

  return {
    transcribeAudio,
    isTranscribing
  };
};