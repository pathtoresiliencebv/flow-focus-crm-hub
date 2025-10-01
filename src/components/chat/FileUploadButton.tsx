import React, { useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadButtonProps {
  onFileSelect: (file: File, type: 'photo' | 'file') => void;
  disabled?: boolean;
  type: 'photo' | 'file';
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  disabled = false,
  type
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Bestand te groot",
        description: "Maximale bestandsgrootte is 50MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (type === 'photo') {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ongeldig bestandstype",
          description: "Alleen afbeeldingen zijn toegestaan",
          variant: "destructive"
        });
        return;
      }
    }

    onFileSelect(file, type);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const acceptTypes = type === 'photo' 
    ? 'image/*' 
    : '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip';

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="h-9 w-9"
      >
        {type === 'photo' ? (
          <Image className="h-4 w-4" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};

