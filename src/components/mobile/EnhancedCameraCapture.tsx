import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Camera, 
  Video, 
  FileText, 
  Receipt, 
  Briefcase, 
  X, 
  Download,
  Settings,
  RotateCcw,
  Zap,
  ZapOff
} from "lucide-react";
import { useEnhancedCamera, CapturedMedia } from "@/hooks/useEnhancedCamera";
import { cn } from "@/lib/utils";

interface EnhancedCameraCaptureProps {
  onMediaCaptured?: (media: CapturedMedia | CapturedMedia[]) => void;
  onClose?: () => void;
  trigger?: React.ReactNode;
  className?: string;
}

export const EnhancedCameraCapture: React.FC<EnhancedCameraCaptureProps> = ({
  onMediaCaptured,
  onClose,
  trigger,
  className
}) => {
  const {
    isNativeApp,
    isCapturing,
    capturedMedia,
    capturePhoto,
    captureMultiplePhotos,
    captureDocument,
    captureReceipt,
    captureWorkPhoto,
    recordVideo,
    clearCapturedMedia,
    removeCapturedMedia
  } = useEnhancedCamera();

  const [batchCount, setBatchCount] = useState(3);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchCapturing, setIsBatchCapturing] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSinglePhoto = async () => {
    const photo = await capturePhoto({
      quality: selectedQuality === 'high' ? 95 : selectedQuality === 'medium' ? 80 : 60,
      allowEditing: true
    });
    
    if (photo) {
      onMediaCaptured?.(photo);
    }
  };

  const handleMultiplePhotos = async () => {
    setIsBatchCapturing(true);
    setBatchProgress(0);
    
    const photos = await captureMultiplePhotos(
      batchCount,
      {
        quality: selectedQuality === 'high' ? 95 : selectedQuality === 'medium' ? 80 : 60,
        allowEditing: false
      },
      (current, total) => {
        setBatchProgress((current / total) * 100);
      }
    );
    
    if (photos.length > 0) {
      onMediaCaptured?.(photos);
    }
    
    setIsBatchCapturing(false);
    setBatchProgress(0);
  };

  const handleDocumentScan = async () => {
    const doc = await captureDocument();
    if (doc) {
      onMediaCaptured?.(doc);
    }
  };

  const handleReceiptScan = async () => {
    const receipt = await captureReceipt();
    if (receipt) {
      onMediaCaptured?.(receipt);
    }
  };

  const handleWorkPhoto = async () => {
    const workPhoto = await captureWorkPhoto(selectedQuality);
    if (workPhoto) {
      onMediaCaptured?.(workPhoto);
    }
  };

  const handleVideoRecord = async () => {
    const video = await recordVideo({
      quality: selectedQuality,
      duration: 60 // 1 minute max
    });
    if (video) {
      onMediaCaptured?.(video);
    }
  };

  const handleRemoveMedia = (timestamp: number) => {
    removeCapturedMedia(timestamp);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isNativeApp) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Camera functionaliteit is alleen beschikbaar in de mobiele app</p>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Quality & Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Camera Instellingen</h3>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as const).map((quality) => (
            <Button
              key={quality}
              variant={selectedQuality === quality ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedQuality(quality)}
              className="flex-1"
            >
              {quality === 'low' ? 'Laag' : quality === 'medium' ? 'Gemiddeld' : 'Hoog'}
            </Button>
          ))}
        </div>
        
        <Button
          variant={flashEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFlashEnabled(!flashEnabled)}
          className="w-full"
        >
          {flashEnabled ? <Zap className="h-4 w-4 mr-2" /> : <ZapOff className="h-4 w-4 mr-2" />}
          Flash {flashEnabled ? 'Aan' : 'Uit'}
        </Button>
      </div>

      {/* Capture Options */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Foto Opties</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleSinglePhoto}
            disabled={isCapturing || isBatchCapturing}
            className="h-16 flex-col gap-1"
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs">Enkele Foto</span>
          </Button>

          <Button
            onClick={handleWorkPhoto}
            disabled={isCapturing || isBatchCapturing}
            variant="outline"
            className="h-16 flex-col gap-1"
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-xs">Werk Foto</span>
          </Button>

          <Button
            onClick={handleDocumentScan}
            disabled={isCapturing || isBatchCapturing}
            variant="outline"
            className="h-16 flex-col gap-1"
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">Document</span>
          </Button>

          <Button
            onClick={handleReceiptScan}
            disabled={isCapturing || isBatchCapturing}
            variant="outline"
            className="h-16 flex-col gap-1"
          >
            <Receipt className="h-5 w-5" />
            <span className="text-xs">Bonnetje</span>
          </Button>
        </div>
      </div>

      {/* Multiple Photos */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Meerdere Foto's</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Aantal:</span>
          {[2, 3, 5, 10].map((count) => (
            <Button
              key={count}
              variant={batchCount === count ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBatchCount(count)}
              disabled={isBatchCapturing}
            >
              {count}
            </Button>
          ))}
        </div>
        
        {isBatchCapturing && (
          <div className="space-y-2">
            <Progress value={batchProgress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">
              Foto's maken... {Math.round(batchProgress)}%
            </p>
          </div>
        )}
        
        <Button
          onClick={handleMultiplePhotos}
          disabled={isCapturing || isBatchCapturing}
          variant="outline"
          className="w-full"
        >
          <Camera className="h-4 w-4 mr-2" />
          Maak {batchCount} Foto's
        </Button>
      </div>

      {/* Video Recording */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Video Opname</h3>
        <Button
          onClick={handleVideoRecord}
          disabled={isCapturing || isBatchCapturing}
          variant="outline"
          className="w-full"
        >
          <Video className="h-4 w-4 mr-2" />
          Video Opnemen
        </Button>
      </div>

      {/* Captured Media Preview */}
      {capturedMedia.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Vastgelegde Media ({capturedMedia.length})</h3>
            <Button
              onClick={clearCapturedMedia}
              variant="ghost"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {capturedMedia.map((media) => (
                <div
                  key={media.timestamp}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-muted-foreground/20 rounded flex items-center justify-center">
                      <Camera className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{media.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(media.fileSize / 1024)}KB
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveMedia(media.timestamp)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );

  if (trigger) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className={className}>
          {trigger}
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Enhanced Camera</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full mt-4">
            {content}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn("p-4", className)}>
      {content}
    </div>
  );
};