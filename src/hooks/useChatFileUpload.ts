import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

export const useChatFileUpload = () => {
  const [uploads, setUploads] = useState<Map<string, FileUploadProgress>>(new Map());
  const { toast } = useToast();

  const updateUploadProgress = useCallback((fileId: string, update: Partial<FileUploadProgress>) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(fileId);
      if (existing) {
        newMap.set(fileId, { ...existing, ...update });
      }
      return newMap;
    });
  }, []);

  const generateThumbnail = useCallback(async (file: File): Promise<string | undefined> => {
    if (!file.type.startsWith('image/')) {
      return undefined;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            resolve(undefined);
          }
        }, 'image/jpeg', 0.7);
      };

      img.onerror = () => resolve(undefined);
      
      const reader = new FileReader();
      reader.onload = () => img.src = reader.result as string;
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadFile = useCallback(async (file: File, userId: string): Promise<UploadResult> => {
    const fileId = `${Date.now()}-${file.name}`;
    const filePath = `${userId}/${fileId}`;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Bestand is te groot (max 10MB)');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/webm', 'audio/mp3', 'audio/wav'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Bestandstype niet ondersteund');
    }

    // Initialize upload progress
    setUploads(prev => new Map(prev).set(fileId, {
      file,
      progress: 0,
      status: 'uploading'
    }));

    try {
      // Generate thumbnail for images
      const thumbnailData = await generateThumbnail(file);
      let thumbnailUrl: string | undefined;

      if (thumbnailData) {
        const thumbnailBlob = await fetch(thumbnailData).then(r => r.blob());
        const thumbnailPath = `${userId}/thumbnails/${fileId}`;
        
        const { error: thumbnailError } = await supabase.storage
          .from('chat-files')
          .upload(thumbnailPath, thumbnailBlob);

        if (!thumbnailError) {
          const { data: thumbnailUrlData } = supabase.storage
            .from('chat-files')
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbnailUrlData.publicUrl;
        }
      }

      // Upload main file
      updateUploadProgress(fileId, { progress: 50 });
      
      const { error: uploadError, data } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      const result: UploadResult = {
        url: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        thumbnailUrl
      };

      updateUploadProgress(fileId, { 
        status: 'completed', 
        progress: 100, 
        url: result.url 
      });

      // Clean up after 2 seconds
      setTimeout(() => {
        setUploads(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }, 2000);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      updateUploadProgress(fileId, { 
        status: 'error', 
        error: errorMessage 
      });

      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    }
  }, [updateUploadProgress, generateThumbnail, toast]);

  const uploadMultipleFiles = useCallback(async (files: File[], userId: string): Promise<UploadResult[]> => {
    const uploadPromises = Array.from(files).map(file => 
      uploadFile(file, userId).catch(error => {
        console.error(`Failed to upload ${file.name}:`, error);
        return null;
      })
    );

    const results = await Promise.all(uploadPromises);
    return results.filter((result): result is UploadResult => result !== null);
  }, [uploadFile]);

  const getFileIcon = useCallback((fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('word')) return '📝';
    return '📎';
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    uploads: Array.from(uploads.values()),
    uploadFile,
    uploadMultipleFiles,
    getFileIcon,
    formatFileSize
  };
};