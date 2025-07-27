import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export interface FileUploadResult {
  name: string;
  content: string;
  contentType: string;
  size: number;
}

interface FileUploadProps {
  onFilesSelected: (files: FileUploadResult[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  children?: React.ReactNode;
}

export function FileUpload({ 
  onFilesSelected, 
  accept = "image/*,.pdf,.doc,.docx,.txt", 
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  children 
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const results: FileUploadResult[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > maxSize) {
          toast({
            title: "Bestand te groot",
            description: `${file.name} is groter dan ${Math.round(maxSize / 1024 / 1024)}MB`,
            variant: "destructive"
          });
          continue;
        }

        const content = await fileToBase64(file);
        results.push({
          name: file.name,
          content: content.split(',')[1], // Remove data:type;base64, prefix
          contentType: file.type,
          size: file.size
        });
      }

      if (results.length > 0) {
        onFilesSelected(results);
        toast({
          title: "Bestanden toegevoegd",
          description: `${results.length} bestand(en) succesvol toegevoegd`
        });
      }
    } catch (error) {
      toast({
        title: "Upload fout",
        description: "Er ging iets mis bij het uploaden van de bestanden",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  if (children) {
    return (
      <div onClick={handleClick} className="cursor-pointer">
        {children}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <Card
      className={`border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
        dragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-2">
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">
            {uploading ? 'Bestanden uploaden...' : 'Sleep bestanden hier of klik om te selecteren'}
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, afbeeldingen tot {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>
    </Card>
  );
}

interface AttachmentListProps {
  attachments: FileUploadResult[];
  onRemove: (index: number) => void;
}

export function AttachmentList({ attachments, onRemove }: AttachmentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Bijlagen ({attachments.length})</p>
      <div className="space-y-2">
        {attachments.map((file, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}