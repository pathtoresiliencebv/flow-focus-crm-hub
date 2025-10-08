import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useI18n } from '@/contexts/I18nContext';
import { Language } from '@/lib/i18n';

const languages = [
  { code: 'nl' as Language, label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { code: 'pl' as Language, label: 'Polski', flag: '🇵🇱' },
  { code: 'ro' as Language, label: 'Română', flag: '🇷🇴' },
  { code: 'tr' as Language, label: 'Türkçe', flag: '🇹🇷' },
];

export const LanguageSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage, isLoading } = useI18n();
  
  const selectedLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = async (newLang: string) => {
    try {
      await setLanguage(newLang as Language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <Select value={language} onValueChange={handleLanguageChange} disabled={isLoading}>
      <SelectTrigger className={className || "w-[180px]"}>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {selectedLanguage && (
            <>
              <span>{selectedLanguage.flag}</span>
              <SelectValue />
            </>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

