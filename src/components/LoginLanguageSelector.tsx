import React from 'react';
import { Languages } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

interface LoginLanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const LoginLanguageSelector: React.FC<LoginLanguageSelectorProps> = ({ value, onChange }) => {
  const selectedLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === value) || AVAILABLE_LANGUAGES[0];

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Languages className="h-4 w-4" />
        Taal / Language
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedLanguage.flag}</span>
              <span>{selectedLanguage.nativeName}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-muted-foreground">({language.name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Kies uw voorkeurstaal voor de interface
      </p>
    </div>
  );
};

export { AVAILABLE_LANGUAGES };

