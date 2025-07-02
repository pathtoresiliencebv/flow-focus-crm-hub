import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MobilePhotoUploadProps {
  projectId: string;
}

interface Photo {
  id: string;
  url: string;
  description: string;
  timestamp: string;
}

export const MobilePhotoUpload: React.FC<MobilePhotoUploadProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    
    try {
      // For now, we'll create a mock photo entry since we don't have storage buckets configured
      const photoId = crypto.randomUUID();
      const photoUrl = URL.createObjectURL(file);
      
      const newPhoto: Photo = {
        id: photoId,
        url: photoUrl,
        description: description || 'Werkfoto',
        timestamp: new Date().toISOString(),
      };

      // Register the photo in project_registrations table
      const { error } = await supabase
        .from('project_registrations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          registration_type: 'photo',
          description: newPhoto.description,
          photo_url: photoUrl, // In real implementation, this would be the storage URL
        });

      if (error) throw error;

      setPhotos(prev => [newPhoto, ...prev]);
      setDescription('');
      
      toast({
        title: "Foto toegevoegd",
        description: "De foto is succesvol geregistreerd",
      });

    } catch (error) {
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het uploaden van de foto",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    toast({
      title: "Foto verwijderd",
      description: "De foto is verwijderd uit het project",
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Foto's toevoegen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="photo-description">Beschrijving</Label>
            <Input
              id="photo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschrijf de foto..."
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleCameraCapture}
              disabled={isUploading}
              className="flex flex-col items-center gap-2 h-20"
            >
              <Camera className="h-6 w-6" />
              <span className="text-xs">Camera</span>
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="flex flex-col items-center gap-2 h-20"
            >
              <Upload className="h-6 w-6" />
              <span className="text-xs">Galerij</span>
            </Button>
          </div>

          {isUploading && (
            <div className="text-center text-sm text-muted-foreground">
              Foto wordt geüpload...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Foto's ({photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.url}
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
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {photo.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.timestamp).toLocaleString('nl-NL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {photos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nog geen foto's toegevoegd</p>
          <p className="text-sm">Gebruik de camera of galerij om foto's toe te voegen</p>
        </div>
      )}
    </div>
  );
};