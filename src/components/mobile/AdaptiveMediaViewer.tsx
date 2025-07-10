import React, { useState, useCallback } from 'react';
import { Download, Eye, Maximize2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNetworkAware } from '@/hooks/useNetworkAware';
import { useToast } from '@/hooks/use-toast';

interface AdaptiveMediaViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  thumbnailUrl?: string;
  fileSize?: number;
  className?: string;
}

export const AdaptiveMediaViewer: React.FC<AdaptiveMediaViewerProps> = ({
  fileUrl,
  fileName,
  fileType,
  thumbnailUrl,
  fileSize,
  className = ""
}) => {
  const { networkQuality, adaptiveSettings, downloadFile } = useNetworkAware();
  const { toast } = useToast();
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const shouldAutoLoad = adaptiveSettings.autoDownload && networkQuality !== 'poor';
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
  };

  const handleDownload = useCallback(() => {
    downloadFile(fileUrl, fileName);
  }, [downloadFile, fileUrl, fileName]);

  const handleImageClick = useCallback(() => {
    if (!shouldAutoLoad && !imageLoaded) {
      // Load full image on demand for poor connections
      setImageLoaded(true);
      toast({
        title: "Loading image",
        description: "Loading full resolution image...",
        variant: "default"
      });
    } else {
      setShowFullImage(true);
    }
  }, [shouldAutoLoad, imageLoaded, toast]);

  if (isImage) {
    return (
      <div className={`relative group ${className}`}>
        <div 
          className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleImageClick}
        >
          {/* Network quality indicator */}
          <div className="absolute top-2 left-2 z-10">
            <Badge 
              variant={networkQuality === 'poor' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {networkQuality === 'poor' ? 'Low Quality' : 'Auto Quality'}
            </Badge>
          </div>

          {/* Main image */}
          {shouldAutoLoad || imageLoaded ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="w-full h-auto max-w-xs rounded-lg"
              loading={networkQuality === 'excellent' ? 'eager' : 'lazy'}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            // Thumbnail or placeholder for poor connections
            <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={fileName}
                  className="w-full h-full object-cover rounded-lg opacity-75"
                />
              ) : (
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tap to load</p>
                  {fileSize && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileSize)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullImage(true);
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Full screen overlay */}
        {showFullImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullImage(false)}
          >
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="ghost"
              className="absolute top-4 right-4 text-white"
              onClick={() => setShowFullImage(false)}
            >
              ✕
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative rounded-lg overflow-hidden">
          {/* Network quality indicator */}
          <div className="absolute top-2 left-2 z-10">
            <Badge 
              variant={networkQuality === 'poor' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {adaptiveSettings.videoQuality} quality
            </Badge>
          </div>

          {shouldAutoLoad ? (
            <video
              controls
              className="w-full max-w-xs rounded-lg"
              preload={networkQuality === 'excellent' ? 'auto' : 'metadata'}
            >
              <source src={fileUrl} type={fileType} />
              Video not supported
            </video>
          ) : (
            <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tap to load video</p>
                {fileSize && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileSize)}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generic file display
  return (
    <div className={`bg-muted rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          {fileSize && (
            <p className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};