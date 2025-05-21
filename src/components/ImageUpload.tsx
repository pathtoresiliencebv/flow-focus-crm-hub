
import React from 'react';
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [dragActive, setDragActive] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Bestand is te groot. Maximum is 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      const file = e.dataTransfer.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        alert("Bestand is te groot. Maximum is 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className={`relative ${className}`}>
      {value ? (
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={value}
            alt="Logo preview"
            className="w-full h-full object-contain bg-gray-50"
          />
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
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 transition-colors bg-gray-50 
            ${dragActive ? "border-primary bg-primary/5" : "border-gray-300"}`}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-center text-gray-600 mb-2">
            Sleep uw logo hierheen of
          </p>
          <label htmlFor="logo-upload" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Selecteer bestand
            </Button>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
};
