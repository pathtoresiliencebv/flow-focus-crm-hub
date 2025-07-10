import React from 'react';
import { Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Language {
  code: string;
  name: string;
}

interface MobileLanguageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  supportedLanguages: Language[];
  onLanguageChange: (languageCode: string) => void;
}

export const MobileLanguageSettings: React.FC<MobileLanguageSettingsProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  supportedLanguages,
  onLanguageChange
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Taal Instellingen
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Jouw Taal</Label>
            <Select value={currentLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Berichten in andere talen kunnen automatisch worden vertaald naar je gekozen taal.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};