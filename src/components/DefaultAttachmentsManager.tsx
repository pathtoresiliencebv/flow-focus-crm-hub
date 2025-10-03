import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Trash2, Download, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export interface DefaultAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface DefaultAttachmentsManagerProps {
  value: DefaultAttachment[];
  onChange: (attachments: DefaultAttachment[]) => void;
}

export const DefaultAttachmentsManager = ({ value, onChange }: DefaultAttachmentsManagerProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: any[]) => {
    setUploading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const newAttachments: DefaultAttachment[] = [];

      for (const file of files) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `default-attachments/${fileName}`;

        // Determine correct MIME type for PDFs
        const contentType = file.name.toLowerCase().endsWith('.pdf') 
          ? 'application/pdf' 
          : file.type;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('quote-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType  // Explicitly set MIME type
          });

        if (error) {
          console.error('Storage upload error:', error);
          throw new Error(`Fout bij uploaden van ${file.name}: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('quote-attachments')
          .getPublicUrl(filePath);

        const attachment: DefaultAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        newAttachments.push(attachment);
      }

      onChange([...value, ...newAttachments]);
      
      toast({
        title: "Standaard bijlagen toegevoegd",
        description: `${newAttachments.length} bestand(en) toegevoegd als standaard bijlagen.`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload mislukt",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het uploaden.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    onChange(value.filter(attachment => attachment.id !== id));
    toast({
      title: "Bijlage verwijderd",
      description: "De standaard bijlage is verwijderd.",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    return '📁';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standaard Bijlagen</CardTitle>
        <p className="text-sm text-muted-foreground">
          Deze bestanden worden automatisch toegevoegd aan nieuwe offertes en facturen.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploading ? (
          <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Bestanden uploaden...
            </div>
          </div>
        ) : (
          <FileUpload
            onFilesSelected={handleFileUpload}
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
            maxSize={10 * 1024 * 1024} // 10MB max per file
          />
        )}

        {value.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Standaard bijlagen ({value.length})</h4>
            <div className="space-y-2">
              {value.map(attachment => (
                <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="text-lg">
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.url, '_blank')}
                      title="Bestand bekijken"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      title="Bestand verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {value.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nog geen standaard bijlagen. Deze worden automatisch toegevoegd aan nieuwe offertes en facturen.
          </p>
        )}
      </CardContent>
    </Card>
  );
};