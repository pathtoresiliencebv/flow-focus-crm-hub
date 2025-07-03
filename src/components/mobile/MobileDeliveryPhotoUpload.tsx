import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { CameraSource } from '@capacitor/camera';

interface MobileDeliveryPhotoUploadProps {
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

interface DeliveryPhoto {
  id: string;
  dataUrl: string;
  description: string;
  timestamp: string;
}

export const MobileDeliveryPhotoUpload: React.FC<MobileDeliveryPhotoUploadProps> = ({ 
  onPhotosChange, 
  maxPhotos = 10 
}) => {
  const { toast } = useToast();
  const { takePicture, isNativeApp, hapticFeedback } = useNativeCapabilities();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<DeliveryPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [description, setDescription] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoAdd(file);
    }
  };

  const handleCameraCapture = async () => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum bereikt",
        description: `Je kunt maximaal ${maxPhotos} foto's toevoegen`,
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    
    try {
      if (isNativeApp) {
        const result = await takePicture({ 
          source: CameraSource.Camera
        });
        
        if (result) {
          const newPhoto: DeliveryPhoto = {
            id: crypto.randomUUID(),
            dataUrl: result.dataUrl,
            description: description || 'Oplevering foto',
            timestamp: new Date().toISOString(),
          };
          
          const updatedPhotos = [...photos, newPhoto];
          setPhotos(updatedPhotos);
          onPhotosChange(updatedPhotos.map(p => p.dataUrl));
          setDescription('');
          
          toast({
            title: "Foto toegevoegd",
            description: "De foto is toegevoegd aan de oplevering",
          });
        }
      } else {
        // Fallback for web
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het maken van de foto",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGallerySelect = async () => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum bereikt",
        description: `Je kunt maximaal ${maxPhotos} foto's toevoegen`,
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    
    try {
      if (isNativeApp) {
        const result = await takePicture({ 
          source: CameraSource.Photos
        });
        
        if (result) {
          const newPhoto: DeliveryPhoto = {
            id: crypto.randomUUID(),
            dataUrl: result.dataUrl,
            description: description || 'Oplevering foto',
            timestamp: new Date().toISOString(),
          };
          
          const updatedPhotos = [...photos, newPhoto];
          setPhotos(updatedPhotos);
          onPhotosChange(updatedPhotos.map(p => p.dataUrl));
          setDescription('');
          
          toast({
            title: "Foto toegevoegd",
            description: "De foto is toegevoegd aan de oplevering",
          });
        }
      } else {
        // Fallback for web
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het selecteren van de foto",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePhotoAdd = async (file: File) => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum bereikt",
        description: `Je kunt maximaal ${maxPhotos} foto's toevoegen`,
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        const newPhoto: DeliveryPhoto = {
          id: crypto.randomUUID(),
          dataUrl,
          description: description || 'Oplevering foto',
          timestamp: new Date().toISOString(),
        };
        
        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos.map(p => p.dataUrl));
        setDescription('');
        
        toast({
          title: "Foto toegevoegd",
          description: "De foto is toegevoegd aan de oplevering",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het verwerken van de foto",
        variant: "destructive",
      });
    }
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos.map(p => p.dataUrl));
    
    toast({
      title: "Foto verwijderd",
      description: "De foto is verwijderd uit de oplevering",
    });
  };

  return (
    <div className="space-y-4">
      {/* Photo Description Input */}
      <div>
        <Label htmlFor="photo-description">Beschrijving foto (optioneel)</Label>
        <Input
          id="photo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschrijf wat er op de foto staat..."
          disabled={isCapturing}
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
          onClick={async () => {
            await hapticFeedback();
            await handleCameraCapture();
          }}
          disabled={isCapturing || photos.length >= maxPhotos}
          className="flex flex-col items-center gap-2 h-20"
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs">
            {isCapturing ? 'Bezig...' : 'Camera'}
          </span>
        </Button>
        
        <Button 
          onClick={async () => {
            await hapticFeedback();
            await handleGallerySelect();
          }}
          disabled={isCapturing || photos.length >= maxPhotos}
          variant="outline"
          className="flex flex-col items-center gap-2 h-20"
        >
          <Upload className="h-6 w-6" />
          <span className="text-xs">
            {isCapturing ? 'Bezig...' : 'Galerij'}
          </span>
        </Button>
      </div>

      {/* Photo Counter */}
      <div className="text-center text-sm text-muted-foreground">
        {photos.length} van {maxPhotos} foto's
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="text-sm font-medium">Toegevoegde foto's</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.dataUrl}
                  alt={photo.description}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removePhoto(photo.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {photo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nog geen foto's toegevoegd</p>
          <p className="text-xs">Maak foto's van het opgeleverde werk</p>
        </div>
      )}
    </div>
  );
};