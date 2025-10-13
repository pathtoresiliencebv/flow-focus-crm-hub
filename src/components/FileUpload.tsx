import React from 'react';
import { Upload, X, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  value: string | null;
  onChange: (url: string | null, fileType?: string, fileName?: string) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  className = "",
  accept = "image/*,application/pdf",
  maxSize = 10, // 10MB default
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [fileType, setFileType] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;

    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(`Bestand is te groot. Maximum is ${maxSize}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFileType(file.type);
      setFileName(file.name);
      onChange(result, file.type, file.name);
    };
    reader.readAsDataURL(file);
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleRemove = () => {
    setFileType(null);
    setFileName(null);
    onChange(null);
  };

  const isPDF = value && (fileType?.includes('pdf') || value.includes('application/pdf'));
  const isImage = value && !isPDF;

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="relative overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
          <div className="w-full h-32 sm:h-40 flex items-center justify-center p-4">
            {isPDF ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-16 w-16 text-red-600" />
                <p className="text-sm font-medium text-gray-700">
                  {fileName || 'PDF Document'}
                </p>
                <p className="text-xs text-gray-500">PDF bestand geselecteerd</p>
              </div>
            ) : isImage ? (
              <img
                src={value}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-16 w-16 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  {fileName || 'Bestand'}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 sm:p-8 transition-colors bg-gray-50 min-h-[120px] sm:min-h-[160px]
            ${dragActive ? "border-primary bg-primary/5" : "border-gray-300"}`}
        >
          <div className="flex gap-4 mb-3">
            <Image className="h-8 w-8 text-gray-400" />
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-center text-gray-600 mb-2">
            Sleep uw bestand hierheen of
          </p>
          <input
            id="file-upload"
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <label 
            htmlFor="file-upload" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer mt-2"
          >
            Selecteer bestand
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Images of PDF bestanden (max {maxSize}MB)
          </p>
        </div>
      )}
    </div>
  );
};

