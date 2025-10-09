import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Language, i18n } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';

interface SupportedLanguage {
  language_code: string;
  language_name: string;
  native_name: string;
  flag_emoji: string;
  deepl_code: string;
}

export function LanguageSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('nl');
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLanguages();
    loadUserLanguage();
  }, [user?.id]);

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('is_active', true)
        .order('language_code');

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const loadUserLanguage = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_language_preferences')
        .select('ui_language')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.ui_language) {
        const lang = data.ui_language as Language;
        setCurrentLanguage(lang);
        i18n.setLanguage(lang, user.id);
      }
    } catch (error) {
      console.error('Failed to load user language:', error);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    if (!user?.id || loading) return;

    setLoading(true);
    try {
      const lang = languageCode as Language;

      // Update in database
      const { error } = await supabase
        .from('user_language_preferences')
        .upsert({
          user_id: user.id,
          ui_language: lang,
          preferred_language: lang,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Update i18n service and load translations
      await i18n.setLanguage(lang, user.id);
      setCurrentLanguage(lang);

      const languageName = languages.find(l => l.language_code === lang)?.native_name || lang.toUpperCase();

      // Show toast in NEW language after change
      setTimeout(() => {
        toast({
          title: t('toast_language_changed', '✅ Language Changed'),
          description: t('toast_language_changed_desc', `Interface language set to ${languageName}`),
        });
      }, 300);
    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: "❌ Fout bij wijzigen taal",
        description: "Er ging iets mis bij het wijzigen van de taal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentLang = languages.find(l => l.language_code === currentLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          disabled={loading}
        >
          {currentLang ? (
            <>
              <span className="text-xl">{currentLang.flag_emoji}</span>
              <span className="hidden sm:inline">{currentLang.native_name}</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Taal</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.language_code}
            onClick={() => changeLanguage(language.language_code)}
            className="flex items-center gap-3 cursor-pointer"
            disabled={loading || language.language_code === currentLanguage}
          >
            <span className="text-xl">{language.flag_emoji}</span>
            <div className="flex flex-col">
              <span className="font-medium">{language.native_name}</span>
              <span className="text-xs text-muted-foreground">{language.language_name}</span>
            </div>
            {language.language_code === currentLanguage && (
              <span className="ml-auto text-green-600">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
