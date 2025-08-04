import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, Languages, Check } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'select' | 'compact';
  showFlags?: boolean;
  showUI?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showFlags = true,
  showUI = true,
  className = '',
}) => {
  const {
    supportedLanguages,
    userPreferences,
    updateUserPreferences,
    getLanguageFlag,
    getLanguageName,
    t,
  } = useTranslation();

  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (languageCode: string, type: 'ui' | 'chat') => {
    setIsChanging(true);
    try {
      if (type === 'ui') {
        await updateUserPreferences({ ui_language: languageCode });
      } else {
        await updateUserPreferences({ preferred_language: languageCode });
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const uiSupportedLanguages = supportedLanguages.filter(lang => lang.ui_supported);
  const currentUILanguage = supportedLanguages.find(lang => lang.language_code === userPreferences.ui_language);
  const currentChatLanguage = supportedLanguages.find(lang => lang.language_code === userPreferences.preferred_language);

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {showFlags && currentUILanguage && (
          <span className="text-sm">{currentUILanguage.flag_emoji}</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('settings.interface_language', 'Interface Language')}</DropdownMenuLabel>
            {uiSupportedLanguages.map((language) => (
              <DropdownMenuItem
                key={`ui-${language.language_code}`}
                onClick={() => handleLanguageChange(language.language_code, 'ui')}
                disabled={isChanging}
              >
                <div className="flex items-center gap-2 w-full">
                  {showFlags && <span>{language.flag_emoji}</span>}
                  <span className="flex-1">{language.native_name}</span>
                  {userPreferences.ui_language === language.language_code && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (variant === 'select') {
    return (
      <div className={`space-y-4 ${className}`}>
        {showUI && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('settings.interface_language', 'Interface Language')}
            </label>
            <Select
              value={userPreferences.ui_language}
              onValueChange={(value) => handleLanguageChange(value, 'ui')}
              disabled={isChanging}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {showFlags && currentUILanguage && (
                      <span>{currentUILanguage.flag_emoji}</span>
                    )}
                    <span>{currentUILanguage?.native_name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {uiSupportedLanguages.map((language) => (
                  <SelectItem key={language.language_code} value={language.language_code}>
                    <div className="flex items-center gap-2">
                      {showFlags && <span>{language.flag_emoji}</span>}
                      <span>{language.native_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {language.language_name}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('settings.chat_language', 'Preferred Chat Language')}
          </label>
          <Select
            value={userPreferences.preferred_language}
            onValueChange={(value) => handleLanguageChange(value, 'chat')}
            disabled={isChanging}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  {showFlags && currentChatLanguage && (
                    <span>{currentChatLanguage.flag_emoji}</span>
                  )}
                  <span>{currentChatLanguage?.native_name}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((language) => (
                <SelectItem key={language.language_code} value={language.language_code}>
                  <div className="flex items-center gap-2">
                    {showFlags && <span>{language.flag_emoji}</span>}
                    <span>{language.native_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {language.language_name}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isChanging}>
            <div className="flex items-center gap-2">
              {showFlags && currentUILanguage && (
                <span>{currentUILanguage.flag_emoji}</span>
              )}
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">
                {currentUILanguage?.native_name || t('common.language', 'Language')}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('settings.interface_language', 'Interface Language')}
          </DropdownMenuLabel>
          {uiSupportedLanguages.map((language) => (
            <DropdownMenuItem
              key={`ui-${language.language_code}`}
              onClick={() => handleLanguageChange(language.language_code, 'ui')}
              disabled={isChanging}
            >
              <div className="flex items-center gap-2 w-full">
                {showFlags && <span>{language.flag_emoji}</span>}
                <span className="flex-1">{language.native_name}</span>
                <Badge variant="outline" className="text-xs">
                  {language.language_name}
                </Badge>
                {userPreferences.ui_language === language.language_code && (
                  <Check className="h-3 w-3" />
                )}
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            {t('settings.chat_language', 'Chat Language')}
          </DropdownMenuLabel>
          {supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={`chat-${language.language_code}`}
              onClick={() => handleLanguageChange(language.language_code, 'chat')}
              disabled={isChanging}
            >
              <div className="flex items-center gap-2 w-full">
                {showFlags && <span>{language.flag_emoji}</span>}
                <span className="flex-1">{language.native_name}</span>
                <Badge variant="outline" className="text-xs">
                  {language.language_name}
                </Badge>
                {userPreferences.preferred_language === language.language_code && (
                  <Check className="h-3 w-3" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};