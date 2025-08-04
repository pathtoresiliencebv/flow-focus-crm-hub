import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Languages, MessageSquare, Globe, CheckCircle } from "lucide-react";
import { useTranslation, UserLanguagePreferences } from '@/hooks/useTranslation';
import { useToast } from "@/components/ui/use-toast";

export const LanguageSettings: React.FC = () => {
  const { 
    supportedLanguages, 
    userPreferences, 
    updateUserPreferences, 
    loading,
    t,
    getLanguageFlag,
    getLanguageName 
  } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [tempPreferences, setTempPreferences] = useState<UserLanguagePreferences>(userPreferences);

  React.useEffect(() => {
    setTempPreferences(userPreferences);
  }, [userPreferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserPreferences(tempPreferences);
      toast({
        title: t('common.success', 'Success'),
        description: t('settings.language_updated', 'Language settings have been updated'),
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: t('common.error', 'Error'),
        description: t('settings.language_update_failed', 'Failed to update language settings'),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(tempPreferences) !== JSON.stringify(userPreferences);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const uiSupportedLanguages = supportedLanguages.filter(lang => lang.ui_supported);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('settings.language_preferences', 'Language Preferences')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interface Language */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.interface_language', 'Interface Language')}
            </Label>
            <Select
              value={tempPreferences.ui_language}
              onValueChange={(value) => 
                setTempPreferences(prev => ({ ...prev, ui_language: value }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>{getLanguageFlag(tempPreferences.ui_language)}</span>
                    <span>{getLanguageName(tempPreferences.ui_language)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {uiSupportedLanguages.map((language) => (
                  <SelectItem key={language.language_code} value={language.language_code}>
                    <div className="flex items-center gap-2">
                      <span>{language.flag_emoji}</span>
                      <span>{language.native_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {language.language_name}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('settings.interface_language_description', 'Language for menus, buttons, and interface elements')}
            </p>
          </div>

          {/* Chat Language */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('settings.chat_language', 'Preferred Chat Language')}
            </Label>
            <Select
              value={tempPreferences.preferred_language}
              onValueChange={(value) => 
                setTempPreferences(prev => ({ ...prev, preferred_language: value }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>{getLanguageFlag(tempPreferences.preferred_language)}</span>
                    <span>{getLanguageName(tempPreferences.preferred_language)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((language) => (
                  <SelectItem key={language.language_code} value={language.language_code}>
                    <div className="flex items-center gap-2">
                      <span>{language.flag_emoji}</span>
                      <span>{language.native_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {language.language_name}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t('settings.chat_language_description', 'Messages will be translated to this language')}
            </p>
          </div>

          {/* Translation Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">
              {t('settings.translation_options', 'Translation Options')}
            </h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>
                  {t('settings.enable_chat_translation', 'Enable Chat Translation')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.chat_translation_description', 'Automatically translate messages to your preferred language')}
                </p>
              </div>
              <Switch
                checked={tempPreferences.chat_translation_enabled}
                onCheckedChange={(checked) => 
                  setTempPreferences(prev => ({ ...prev, chat_translation_enabled: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>
                  {t('settings.auto_detect_language', 'Auto-detect Language')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.auto_detect_description', 'Automatically detect the language of incoming messages')}
                </p>
              </div>
              <Switch
                checked={tempPreferences.auto_detect_language}
                onCheckedChange={(checked) => 
                  setTempPreferences(prev => ({ ...prev, auto_detect_language: checked }))
                }
                disabled={!tempPreferences.chat_translation_enabled}
              />
            </div>
          </div>

          {tempPreferences.chat_translation_enabled && (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                {t('settings.translation_info', 'When translation is enabled, you will see both the original message and its translation in chat conversations.')}
              </AlertDescription>
            </Alert>
          )}

          {hasChanges() && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setTempPreferences(userPreferences)}
                disabled={saving}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('common.saving', 'Saving...')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {t('common.save', 'Save')}
                  </div>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Languages Overview */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('settings.supported_languages', 'Supported Languages')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {supportedLanguages.map((language) => (
              <div
                key={language.language_code}
                className="flex items-center gap-2 p-2 rounded-lg border"
              >
                <span className="text-lg">{language.flag_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {language.native_name}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {language.ui_supported && (
                      <Badge variant="secondary" className="text-xs">
                        UI
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Chat
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};