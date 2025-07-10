import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Pause, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceMessage: (audioUrl: string, transcription: string, duration: number) => void;
}

export const VoiceRecorder = ({ isOpen, onClose, onVoiceMessage }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          throw error;
        }

        setTranscription(data.text || 'Transcriptie niet beschikbaar');
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Error",
        description: "Could not transcribe audio",
        variant: "destructive"
      });
      setTranscription('Transcriptie mislukt');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob, toast]);

  const sendVoiceMessage = useCallback(async () => {
    if (!audioBlob || !audioUrl) return;

    try {
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { 
        type: 'audio/webm' 
      });

      // Here you would upload the audio file and get the URL
      // For now, we'll use the local URL
      onVoiceMessage(audioUrl, transcription, recordingTime);
      handleClose();
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Send Error", 
        description: "Could not send voice message",
        variant: "destructive"
      });
    }
  }, [audioBlob, audioUrl, transcription, recordingTime, onVoiceMessage, toast]);

  const handleClose = useCallback(() => {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Cleanup audio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset state
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setTranscription('');
    setIsTranscribing(false);

    onClose();
  }, [isRecording, stopRecording, audioUrl, onClose]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Auto-transcribe when recording stops
  useEffect(() => {
    if (audioBlob && !isTranscribing) {
      transcribeAudio();
    }
  }, [audioBlob, transcribeAudio, isTranscribing]);

  // Handle audio playback events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Spraakbericht
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recording Visualization */}
          <div className="flex flex-col items-center space-y-4">
            {isRecording ? (
              <div className="relative">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="text-sm font-mono bg-red-100 px-2 py-1 rounded">
                    {formatTime(recordingTime)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <Mic className="h-8 w-8 text-gray-600" />
              </div>
            )}

            {/* Recording Progress for max time (5 minutes) */}
            {isRecording && (
              <Progress value={(recordingTime / 300) * 100} className="w-full" />
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="space-y-2">
              <audio ref={audioRef} src={audioUrl} className="hidden" />
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playRecording}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formatTime(recordingTime)}
                </span>
              </div>
            </div>
          )}

          {/* Transcription */}
          {(transcription || isTranscribing) && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Transcriptie:</div>
              <div className="text-sm bg-gray-50 p-2 rounded-md min-h-[40px]">
                {isTranscribing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    Transcriberen...
                  </div>
                ) : (
                  transcription || 'Geen transcriptie beschikbaar'
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-2">
            {!audioBlob ? (
              // Recording controls
              <>
                <Button variant="outline" onClick={handleClose}>
                  <X className="h-4 w-4 mr-2" />
                  Annuleren
                </Button>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </>
            ) : (
              // Send controls
              <>
                <Button variant="outline" onClick={() => {
                  setAudioBlob(null);
                  setAudioUrl(null);
                  setTranscription('');
                }}>
                  Opnieuw
                </Button>
                <Button onClick={sendVoiceMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Versturen
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};