import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Trash2, Download, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { generateUUID } from '@/utils/uuid';

export interface QuoteAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface FileAttachmentsManagerProps {
  value: QuoteAttachment[];
  onChange: (attachments: QuoteAttachment[]) => void;
}

export const FileAttachmentsManager = ({ value, onChange }: FileAttachmentsManagerProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(async (fileResults: any[]) => {
    if (!fileResults || fileResults.length === 0) {
      console.log('⚠️ Geen bestanden geselecteerd');
      setUploading(false); // Ensure loading state is reset
      return;
    }

    console.log('📤 Start upload van', fileResults.length, 'bestanden');
    setUploading(true);
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const newAttachments: QuoteAttachment[] = [];

      for (const fileResult of fileResults) {
        console.log('📄 Verwerk bestand:', fileResult.name);
        
        // Convert base64 back to blob
        const byteString = atob(fileResult.content);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: fileResult.contentType });

        // Generate unique filename
        const fileExt = fileResult.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `quotes/${fileName}`;

        // Determine correct MIME type for PDFs
        const contentType = fileResult.name.toLowerCase().endsWith('.pdf') 
          ? 'application/pdf' 
          : fileResult.contentType;

        console.log('⬆️ Upload naar Storage:', { filePath, contentType });

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('quote-attachments')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType
          });

        if (error) {
          console.error('❌ Storage upload error:', error);
          throw new Error(`Fout bij uploaden van ${fileResult.name}: ${error.message}`);
        }

        console.log('✅ Upload succesvol:', data);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('quote-attachments')
          .getPublicUrl(filePath);

        const attachment: QuoteAttachment = {
          id: generateUUID(),
          name: fileResult.name,
          url: urlData.publicUrl,
          size: fileResult.size,
          type: fileResult.contentType,
          uploadedAt: new Date().toISOString()
        };
        newAttachments.push(attachment);
      }

      onChange([...value, ...newAttachments]);
      
      toast({
        title: "✅ Bestanden toegevoegd",
        description: `${newAttachments.length} bestand(en) succesvol geüpload naar de offerte.`,
      });
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      toast({
        title: "Upload mislukt",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het uploaden van de bestanden.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [value, onChange, toast]);

  const removeAttachment = (id: string) => {
    onChange(value.filter(attachment => attachment.id !== id));
    toast({
      title: "Bestand verwijderd",
      description: "Het bestand is verwijderd van de offerte.",
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

  const handleDownloadAttachment = async (attachment: QuoteAttachment) => {
    try {
      console.log('📥 Downloading attachment:', attachment.name);
      
      // Fetch the file from the URL
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Create a temporary download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.name;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ Download started for:', attachment.name);
      toast({
        title: "Download gestart",
        description: `${attachment.name} wordt gedownload...`,
      });
    } catch (error) {
      console.error('❌ Error downloading attachment:', error);
      toast({
        title: "Download mislukt",
        description: "Er is een fout opgetreden bij het downloaden van het bestand.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bijlagen</CardTitle>
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
            <h4 className="font-medium text-sm">Bijgevoegde bestanden ({value.length})</h4>
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
                      onClick={() => handleDownloadAttachment(attachment)}
                      title="Bestand downloaden"
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
            Nog geen bijlagen toegevoegd. Sleep bestanden hierheen of klik om bestanden te selecteren.
          </p>
        )}
      </CardContent>
    </Card>
  );
};