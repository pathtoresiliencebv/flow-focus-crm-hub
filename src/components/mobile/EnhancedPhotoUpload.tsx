import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { CameraSource } from '@capacitor/camera';
import { compressImage, isImageFile, isValidImageSize } from '@/utils/imageCompression';
import type { CompletionPhotoData } from '@/hooks/useProjectCompletion';

type PhotoCategory = 'before' | 'during' | 'after' | 'detail' | 'overview';

interface LocalPhoto {
  id: string;
  file: File;
  preview: string; // Data URL for preview
  description: string;
  category: PhotoCategory;
  uploaded: boolean;
  uploadedUrl?: string;
}

interface EnhancedPhotoUploadProps {
  completionId?: string; // If provided, photos are uploaded immediately
  onPhotosChange: (photos: LocalPhoto[]) => void;
  maxPhotos?: number;
  defaultCategory?: PhotoCategory;
  showCategorySelector?: boolean;
}

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  before: '📷 Voor',
  during: '⚙️ Tijdens',
  after: '✅ Na',
  detail: '🔍 Detail',
  overview: '🌐 Overzicht'
};

export const EnhancedPhotoUpload: React.FC<EnhancedPhotoUploadProps> = ({ 
  completionId,
  onPhotosChange, 
  maxPhotos = 20,
  defaultCategory = 'after',
  showCategorySelector = true
}) => {
  const { toast } = useToast();
  const { takePicture, isNativeApp, hapticFeedback } = useNativeCapabilities();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>(defaultCategory);

  /**
   * Convert dataURL or Blob to File
   */
  const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
  };

  /**
   * Handle camera capture (native or web)
   */
  const handleCameraCapture = async () => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum bereikt",
        description: `Je kunt maximaal ${maxPhotos} foto's toevoegen`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    await hapticFeedback();
    
    try {
      if (isNativeApp) {
        const result = await takePicture({ 
          source: CameraSource.Camera,
          quality: 85,
          resultType: 'dataUrl'
        });
        
        if (result?.dataUrl) {
          const file = await dataUrlToFile(
            result.dataUrl, 
            `photo_${Date.now()}.jpg`
          );
          await addPhoto(file);
        }
      } else {
        // Fallback for web
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera fout",
        description: "Er ging iets mis bij het maken van de foto",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle gallery selection
   */
  const handleGallerySelect = async () => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum bereikt",
        description: `Je kunt maximaal ${maxPhotos} foto's toevoegen`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    await hapticFeedback();
    
    try {
      if (isNativeApp) {
        const result = await takePicture({ 
          source: CameraSource.Photos,
          quality: 85,
          resultType: 'dataUrl'
        });
        
        if (result?.dataUrl) {
          const file = await dataUrlToFile(
            result.dataUrl, 
            `photo_${Date.now()}.jpg`
          );
          await addPhoto(file);
        }
      } else {
        // Fallback for web
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      toast({
        title: "Selectie fout",
        description: "Er ging iets mis bij het selecteren van de foto",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle file input change (web fallback)
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await addPhoto(file);
    }
    // Reset input
    event.target.value = '';
  };

  /**
   * Add photo (compress and create preview)
   */
  const addPhoto = async (file: File) => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum bereikt",
        description: `Je kunt maximaal ${maxPhotos} foto's toevoegen`,
        variant: "destructive",
      });
      return;
    }

    // Validate file
    if (!isImageFile(file)) {
      toast({
        title: "Ongeldig bestand",
        description: "Selecteer een geldige afbeelding",
        variant: "destructive",
      });
      return;
    }

    if (!isValidImageSize(file, 10)) {
      toast({
        title: "Bestand te groot",
        description: "De foto mag maximaal 10MB zijn",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Compress image
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85
      });

      // Create preview
      const preview = URL.createObjectURL(compressedFile);

      const newPhoto: LocalPhoto = {
        id: crypto.randomUUID(),
        file: compressedFile,
        preview,
        description: description || `${CATEGORY_LABELS[selectedCategory]} foto`,
        category: selectedCategory,
        uploaded: false
      };
      
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
      setDescription('');
      
      toast({
        title: "Foto toegevoegd ✅",
        description: `${CATEGORY_LABELS[selectedCategory]} foto is klaar om te uploaden`,
      });
    } catch (error) {
      console.error('Photo processing error:', error);
      toast({
        title: "Fout bij verwerken",
        description: "Er ging iets mis bij het verwerken van de foto",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Remove photo
   */
  const removePhoto = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      URL.revokeObjectURL(photo.preview); // Clean up blob URL
    }
    
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
    
    toast({
      title: "Foto verwijderd",
      description: "De foto is verwijderd",
    });
  };

  /**
   * Update photo category
   */
  const updatePhotoCategory = (photoId: string, category: PhotoCategory) => {
    const updatedPhotos = photos.map(p => 
      p.id === photoId ? { ...p, category } : p
    );
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  /**
   * Update photo description
   */
  const updatePhotoDescription = (photoId: string, description: string) => {
    const updatedPhotos = photos.map(p => 
      p.id === photoId ? { ...p, description } : p
    );
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  // Count photos by category
  const photoCounts = photos.reduce((acc, photo) => {
    acc[photo.category] = (acc[photo.category] || 0) + 1;
    return acc;
  }, {} as Record<PhotoCategory, number>);

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      {showCategorySelector && (
        <div>
          <Label htmlFor="photo-category">Foto categorie</Label>
          <Select 
            value={selectedCategory} 
            onValueChange={(value) => setSelectedCategory(value as PhotoCategory)}
          >
            <SelectTrigger id="photo-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description Input */}
      <div>
        <Label htmlFor="photo-description">Beschrijving (optioneel)</Label>
        <Input
          id="photo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschrijf wat er op de foto staat..."
          disabled={isProcessing}
        />
      </div>

      {/* Hidden file input for web fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera Controls */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={handleCameraCapture}
          disabled={isProcessing || photos.length >= maxPhotos}
          className="flex flex-col items-center gap-2 h-20"
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
          <span className="text-xs">
            {isProcessing ? 'Bezig...' : 'Camera'}
          </span>
        </Button>
        
        <Button 
          onClick={handleGallerySelect}
          disabled={isProcessing || photos.length >= maxPhotos}
          variant="outline"
          className="flex flex-col items-center gap-2 h-20"
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
          <span className="text-xs">
            {isProcessing ? 'Bezig...' : 'Galerij'}
          </span>
        </Button>
      </div>

      {/* Photo Counter */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {photos.length} van {maxPhotos} foto's
        </span>
        {Object.keys(photoCounts).length > 0 && (
          <div className="flex gap-2">
            {Object.entries(photoCounts).map(([category, count]) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {CATEGORY_LABELS[category as PhotoCategory].split(' ')[0]} {count}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Toegevoegde foto's</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.preview}
                  alt={photo.description}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                
                {/* Remove Button */}
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(photo.id)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Category Badge */}
                <Badge 
                  className="absolute top-2 left-2 text-xs"
                  variant={photo.uploaded ? "default" : "secondary"}
                >
                  {CATEGORY_LABELS[photo.category].split(' ')[0]}
                </Badge>
                
                {/* Description */}
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {photo.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(photo.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Nog geen foto's toegevoegd</p>
          <p className="text-xs">Maak foto's van het werk</p>
          <p className="text-xs mt-2">
            {CATEGORY_LABELS[selectedCategory]} foto
          </p>
        </div>
      )}
    </div>
  );
};

export type { LocalPhoto, PhotoCategory };

