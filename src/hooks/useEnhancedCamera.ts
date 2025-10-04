import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { useToast } from '@/hooks/use-toast';
import { useNativeCapabilities } from './useNativeCapabilities';

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  source?: CameraSource;
  direction?: CameraDirection;
  saveToGallery?: boolean;
  width?: number;
  height?: number;
}

export interface CapturedMedia {
  webPath?: string;
  dataUrl: string;
  format: string;
  fileName: string;
  fileSize: number;
  timestamp: number;
  metadata?: {
    location?: { lat: number; lng: number };
    deviceInfo?: any;
  };
}

export interface VideoOptions {
  quality?: 'high' | 'medium' | 'low';
  duration?: number; // max duration in seconds
  saveToGallery?: boolean;
}

export const useEnhancedCamera = () => {
  const { toast } = useToast();
  const { isNativeApp, getCurrentLocation, hapticFeedback } = useNativeCapabilities();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);

  const getDeviceInfo = useCallback(async () => {
    try {
      if (isNativeApp) {
        return await Device.getInfo();
      }
      return null;
    } catch (error) {
      console.log('Could not get device info:', error);
      return null;
    }
  }, [isNativeApp]);

  const capturePhoto = useCallback(async (options?: CameraOptions): Promise<CapturedMedia | null> => {
    if (!isNativeApp) {
      toast({
        title: "Camera niet beschikbaar",
        description: "Camera is alleen beschikbaar in de mobiele app",
        variant: "destructive"
      });
      return null;
    }

    try {
      setIsCapturing(true);
      await hapticFeedback();

      const image = await Camera.getPhoto({
        quality: options?.quality || 90,
        allowEditing: options?.allowEditing ?? true,
        resultType: CameraResultType.Uri,
        source: options?.source || CameraSource.Camera,
        direction: options?.direction || CameraDirection.Rear,
        saveToGallery: options?.saveToGallery || false,
        width: options?.width,
        height: options?.height
      });

      // Get additional metadata
      const location = await getCurrentLocation(false);
      const deviceInfo = await getDeviceInfo();

      const capturedPhoto: CapturedMedia = {
        webPath: image.webPath,
        dataUrl: `data:image/${image.format};base64,${image.base64String}`,
        format: image.format || 'jpeg',
        fileName: `photo_${Date.now()}.${image.format || 'jpeg'}`,
        fileSize: image.base64String ? Math.round(image.base64String.length * 0.75) : 0,
        timestamp: Date.now(),
        metadata: {
          location: location ? { lat: location.latitude, lng: location.longitude } : undefined,
          deviceInfo
        }
      };

      setCapturedMedia(prev => [...prev, capturedPhoto]);
      
      toast({
        title: "Foto gemaakt",
        description: `Foto opgeslagen (${Math.round(capturedPhoto.fileSize / 1024)}KB)`,
      });

      return capturedPhoto;
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast({
        title: "Camera fout",
        description: "Kon geen foto maken",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isNativeApp, hapticFeedback, getCurrentLocation, getDeviceInfo, toast]);

  const captureMultiplePhotos = useCallback(async (
    count: number,
    options?: CameraOptions,
    onProgress?: (current: number, total: number) => void
  ): Promise<CapturedMedia[]> => {
    const photos: CapturedMedia[] = [];
    
    for (let i = 0; i < count; i++) {
      onProgress?.(i + 1, count);
      
      const photo = await capturePhoto({
        ...options,
        allowEditing: false // Disable editing for batch capture
      });
      
      if (photo) {
        photos.push(photo);
      } else {
        // If user cancels or error occurs, stop capturing
        break;
      }
      
      // Small delay between captures
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (photos.length > 0) {
      toast({
        title: `${photos.length} foto's gemaakt`,
        description: `Totaal: ${Math.round(photos.reduce((sum, p) => sum + p.fileSize, 0) / 1024)}KB`,
      });
    }

    return photos;
  }, [capturePhoto, toast]);

  const captureDocument = useCallback(async (options?: CameraOptions): Promise<CapturedMedia | null> => {
    // Document scanning with optimized settings
    return capturePhoto({
      ...options,
      quality: 95, // Higher quality for documents
      allowEditing: true, // Allow cropping/editing
      source: CameraSource.Camera,
      direction: CameraDirection.Rear
    });
  }, [capturePhoto]);

  const captureReceipt = useCallback(async (): Promise<CapturedMedia | null> => {
    // Receipt scanning with specific settings
    return captureDocument({
      quality: 100,
      allowEditing: true,
      width: 1200,
      height: 1600
    });
  }, [captureDocument]);

  const captureWorkPhoto = useCallback(async (quality: 'high' | 'medium' | 'low' = 'medium'): Promise<CapturedMedia | null> => {
    const qualityMap = {
      high: 95,
      medium: 80,
      low: 60
    };

    return capturePhoto({
      quality: qualityMap[quality],
      allowEditing: false,
      saveToGallery: true, // Save work photos to gallery
      source: CameraSource.Camera
    });
  }, [capturePhoto]);

  const clearCapturedMedia = useCallback(() => {
    setCapturedMedia([]);
  }, []);

  const removeCapturedMedia = useCallback((timestamp: number) => {
    setCapturedMedia(prev => prev.filter(media => media.timestamp !== timestamp));
  }, []);

  // Simulated video recording (Capacitor doesn't have native video recording yet)
  const recordVideo = useCallback(async (options?: VideoOptions): Promise<CapturedMedia | null> => {
    if (!isNativeApp) {
      toast({
        title: "Video opname niet beschikbaar",
        description: "Video opname is alleen beschikbaar in de mobiele app",
        variant: "destructive"
      });
      return null;
    }

    // For now, we'll use the camera to take a photo and inform the user
    // In a real implementation, you'd integrate with a video recording plugin
    toast({
      title: "Video opname",
      description: "Video opname functionaliteit wordt binnenkort toegevoegd",
      variant: "default"
    });

    return null;
  }, [isNativeApp, toast]);

  return {
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
  };
};