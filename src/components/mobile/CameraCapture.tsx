import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Video, 
  X, 
  Download,
  RotateCcw,
  Settings,
  Zap,
  ZapOff,
  Square
} from "lucide-react";
import { useEnhancedCamera, CapturedMedia } from "@/hooks/useEnhancedCamera";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture?: (media: CapturedMedia) => void;
  onClose?: () => void;
  mode?: 'photo' | 'video' | 'document';
  className?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onClose,
  mode = 'photo',
  className
}) => {
  const {
    isNativeApp,
    isCapturing,
    capturePhoto,
    captureDocument,
    recordVideo
  } = useEnhancedCamera();

  const [selectedQuality, setSelectedQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef<ReturnType<typeof setInterval>>();

  const handleCapture = async () => {
    let media: CapturedMedia | null = null;
    
    const qualityMap = {
      high: 95,
      medium: 80,
      low: 60
    };

    switch (mode) {
      case 'photo':
        media = await capturePhoto({
          quality: qualityMap[selectedQuality],
          allowEditing: true
        });
        break;
      case 'document':
        media = await captureDocument({
          quality: 95,
          allowEditing: true
        });
        break;
      case 'video':
        media = await recordVideo({
          quality: selectedQuality,
          duration: 60
        });
        break;
    }

    if (media) {
      onCapture?.(media);
    }
  };

  const startVideoRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    
    recordingInterval.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000) as ReturnType<typeof setInterval>;
  };

  const stopVideoRecording = () => {
    setIsRecording(false);
    
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    
    // Here you would actually stop the video recording
    // For now, we'll just simulate it
    handleCapture();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isNativeApp) {
    return (
      <Card className={cn("p-4", className)}>
        <CardContent className="text-center space-y-4">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="font-medium">Camera niet beschikbaar</h3>
            <p className="text-sm text-muted-foreground">
              Camera functionaliteit is alleen beschikbaar in de mobiele app
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Camera Viewfinder Placeholder */}
      <Card className="aspect-[4/3] bg-black relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/70 text-center">
            <Camera className="h-16 w-16 mx-auto mb-2" />
            <p className="text-sm">Camera Preview</p>
            <p className="text-xs opacity-70">
              {mode === 'photo' ? 'Foto Modus' : 
               mode === 'video' ? 'Video Modus' : 'Document Modus'}
            </p>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-mono">{formatDuration(recordingDuration)}</span>
          </div>
        )}

        {/* Flash Indicator */}
        {flashEnabled && (
          <div className="absolute top-4 right-4">
            <Zap className="h-6 w-6 text-yellow-400" />
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Card>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* Quality & Flash Settings */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(['low', 'medium', 'high'] as const).map((quality) => (
              <Button
                key={quality}
                variant={selectedQuality === quality ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedQuality(quality)}
              >
                {quality === 'low' ? 'L' : quality === 'medium' ? 'M' : 'H'}
              </Button>
            ))}
          </div>

          <Button
            variant={flashEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFlashEnabled(!flashEnabled)}
          >
            {flashEnabled ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
          </Button>
        </div>

        {/* Capture Controls */}
        <div className="flex items-center justify-center">
          {mode === 'video' ? (
            <Button
              onClick={isRecording ? stopVideoRecording : startVideoRecording}
              disabled={isCapturing}
              className={cn(
                "h-16 w-16 rounded-full p-0",
                isRecording ? "bg-red-500 hover:bg-red-600" : "bg-primary"
              )}
            >
              {isRecording ? (
                <Square className="h-6 w-6 fill-current" />
              ) : (
                <Video className="h-6 w-6" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCapture}
              disabled={isCapturing}
              className="h-16 w-16 rounded-full p-0"
            >
              {isCapturing ? (
                <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </Button>
          )}
        </div>

        {/* Mode Indicator */}
        <div className="text-center">
          <Badge variant="secondary">
            {mode === 'photo' ? 'Foto' :
             mode === 'video' ? 'Video' : 'Document'}
          </Badge>
        </div>
      </div>
    </div>
  );
};