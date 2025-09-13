import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { Trash2, Download, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

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

  const handleFileUpload = useCallback(async (files: any[]) => {
    setUploading(true);
    try {
      const newAttachments: QuoteAttachment[] = [];

      for (const file of files) {
        // In een echte implementatie zou je hier de file uploaden naar Supabase Storage
        // Voor nu simuleren we dit met een URL
        const attachment: QuoteAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          url: URL.createObjectURL(file), // Tijdelijke URL voor demo
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        };
        newAttachments.push(attachment);
      }

      onChange([...value, ...newAttachments]);
      
      toast({
        title: "Bestanden toegevoegd",
        description: `${newAttachments.length} bestand(en) succesvol toegevoegd aan de offerte.`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload mislukt",
        description: "Er is een fout opgetreden bij het uploaden van de bestanden.",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bijlagen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload
          onFilesSelected={handleFileUpload}
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
          maxSize={10 * 1024 * 1024} // 10MB max per file
        />

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
            Nog geen bijlagen toegevoegd. Sleep bestanden hierheen of klik om bestanden te selecteren.
          </p>
        )}
      </CardContent>
    </Card>
  );
};