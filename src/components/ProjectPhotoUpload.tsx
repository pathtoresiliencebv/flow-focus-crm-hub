import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectPhotoUploadProps {
  projectId: string;
  onUploadComplete: () => void;
}

export const ProjectPhotoUpload: React.FC<ProjectPhotoUploadProps> = ({ 
  projectId, 
  onUploadComplete 
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoData, setPhotoData] = useState({
    description: '',
    category: 'other',
    fileData: null as string | null,
    fileName: null as string | null,
    fileType: null as string | null
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoData(prev => ({
        ...prev,
        fileData: reader.result as string,
        fileName: file.name,
        fileType: file.type
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!photoData.fileData) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een foto",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Gebruiker niet gevonden');

      // Get the latest completion for this project
      const { data: completions } = await supabase
        .from('project_completions')
        .select('id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);

      let completionId = completions?.[0]?.id;

      // If no completion exists, create a temporary one for photo upload
      if (!completionId) {
        const { data: newCompletion } = await supabase
          .from('project_completions')
          .insert({
            project_id: projectId,
            installer_id: user.id,
            status: 'in_progress',
            work_performed: 'Foto upload via desktop'
          })
          .select('id')
          .single();
        
        completionId = newCompletion?.id;
      }

      if (!completionId) throw new Error('Kon geen completion maken');

      // Convert base64 to blob
      const base64Data = photoData.fileData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }

      const contentType = photoData.fileType || 'image/jpeg';
      const fileExtension = contentType.includes('png') ? 'png' : 'jpg';
      const blob = new Blob([byteArray], { type: contentType });

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}_photo.${fileExtension}`;
      const { error: uploadError } = await supabase.storage
        .from('completion-photos')
        .upload(fileName, blob, {
          contentType: contentType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('completion-photos')
        .getPublicUrl(fileName);

      // Insert photo record
      const { error: insertError } = await supabase
        .from('completion_photos')
        .insert({
          completion_id: completionId,
          photo_url: publicUrl,
          description: photoData.description || null,
          category: photoData.category,
          file_name: photoData.fileName || null,
          file_size: blob.size || null
        });

      if (insertError) throw insertError;

      toast({
        title: "✅ Foto toegevoegd",
        description: "De foto is succesvol opgeslagen"
      });

      // Reset form
      setPhotoData({
        description: '',
        category: 'other',
        fileData: null,
        fileName: null,
        fileType: null
      });
      
      setOpen(false);
      onUploadComplete();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "❌ Upload fout",
        description: error.message || "Kon foto niet uploaden",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
      >
        <Camera className="h-4 w-4 mr-2" />
        Foto's Uploaden
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Foto Uploaden</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div>
              <Label>Foto</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="mt-1"
                required
              />
              {photoData.fileName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Geselecteerd: {photoData.fileName}
                </p>
              )}
              {photoData.fileData && (
                <img 
                  src={photoData.fileData} 
                  alt="Preview" 
                  className="mt-2 w-full h-48 object-cover rounded-lg border"
                />
              )}
            </div>

            {/* Category */}
            <div>
              <Label>Categorie</Label>
              <Select
                value={photoData.category}
                onValueChange={(value) => setPhotoData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">📷 Voor Foto</SelectItem>
                  <SelectItem value="during">⚙️ Tijdens Werk</SelectItem>
                  <SelectItem value="after">✅ Na Foto</SelectItem>
                  <SelectItem value="detail">🔍 Detail Foto</SelectItem>
                  <SelectItem value="overview">🏠 Overzicht Foto</SelectItem>
                  <SelectItem value="other">📸 Overige</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label>Omschrijving (Optioneel)</Label>
              <Textarea
                value={photoData.description}
                onChange={(e) => setPhotoData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschrijf wat er op de foto te zien is..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={loading}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !photoData.fileData}
              >
                {loading ? "Uploaden..." : "Opslaan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

