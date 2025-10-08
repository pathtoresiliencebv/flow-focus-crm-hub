import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Download, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Language } from '@/lib/i18n';

interface TranslationStats {
  total: number;
  byLanguage: Record<string, number>;
}

export function TranslationManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [newTexts, setNewTexts] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(['en', 'pl', 'ro', 'tr']);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [languages, setLanguages] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    const { data } = await supabase
      .from('supported_languages')
      .select('*')
      .eq('is_active', true)
      .order('language_code');
    
    if (data) setLanguages(data);
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ui_translations')
        .select('language_code');

      if (error) throw error;

      const byLanguage: Record<string, number> = {};
      data?.forEach(t => {
        byLanguage[t.language_code] = (byLanguage[t.language_code] || 0) + 1;
      });

      setStats({
        total: data?.length || 0,
        byLanguage
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const translateBulk = async () => {
    if (!newTexts.trim()) {
      toast({
        title: "❌ Geen teksten",
        description: "Voer eerst teksten in om te vertalen",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    
    try {
      // Split texts by newline
      const texts = newTexts.split('\n').filter(t => t.trim().length > 0);
      
      if (texts.length === 0) {
        throw new Error('Geen geldige teksten gevonden');
      }

      setCurrentOperation(`Voorbereiden van ${texts.length} teksten...`);

      let totalTranslations = 0;
      const totalOperations = selectedLanguages.length;

      for (let i = 0; i < selectedLanguages.length; i++) {
        const targetLang = selectedLanguages[i];
        
        setCurrentOperation(`Vertalen naar ${targetLang.toUpperCase()} (${i + 1}/${totalOperations})...`);

        // Call edge function to translate
        const { data, error } = await supabase.functions.invoke('translate-ui-texts', {
          body: {
            texts,
            targetLanguage: targetLang,
            sourceLanguage: 'nl'
          }
        });

        if (error) {
          console.error(`Error translating to ${targetLang}:`, error);
          continue;
        }

        if (data?.translations) {
          setCurrentOperation(`Opslaan vertalingen voor ${targetLang.toUpperCase()}...`);

          // Save translations to database
          const translationsToSave = texts.map((text, index) => ({
            translation_key: text,
            language_code: targetLang,
            translated_text: data.translations[index] || text,
            context: 'manual_bulk_import',
            updated_at: new Date().toISOString()
          }));

          const { error: saveError } = await supabase
            .from('ui_translations')
            .upsert(translationsToSave, {
              onConflict: 'translation_key,language_code'
            });

          if (saveError) {
            console.error(`Error saving translations for ${targetLang}:`, saveError);
          } else {
            totalTranslations += translationsToSave.length;
          }
        }

        // Update progress
        setProgress(((i + 1) / totalOperations) * 100);
      }

      setCurrentOperation('');
      toast({
        title: "✅ Vertalingen succesvol!",
        description: `${totalTranslations} vertalingen toegevoegd in ${selectedLanguages.length} talen`,
      });

      // Clear input and reload stats
      setNewTexts('');
      loadStats();
    } catch (error: any) {
      console.error('Error during bulk translation:', error);
      toast({
        title: "❌ Fout bij vertalen",
        description: error.message || "Er ging iets mis bij het vertalen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
      setCurrentOperation('');
    }
  };

  const exportTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('ui_translations')
        .select('*')
        .order('translation_key');

      if (error) throw error;

      // Convert to CSV
      const csv = [
        ['Key', 'Language', 'Translation', 'Context'].join(','),
        ...data.map(t => [
          `"${t.translation_key}"`,
          t.language_code,
          `"${t.translated_text}"`,
          t.context || ''
        ].join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "✅ Export gelukt",
        description: `${data.length} vertalingen geëxporteerd`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Export mislukt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Vertaling Beheer
          </h2>
          <p className="text-muted-foreground mt-1">
            Beheer platform vertalingen voor alle ondersteunde talen
          </p>
        </div>
        <Button onClick={exportTranslations} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporteer CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totaal Vertalingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        {languages
          .filter(l => l.language_code !== 'nl')
          .map(lang => (
            <Card key={lang.language_code}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="text-xl">{lang.flag_emoji}</span>
                  {lang.native_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.byLanguage[lang.language_code] || 0}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Bulk Translation */}
      <Tabs defaultValue="bulk" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bulk">Bulk Vertalen</TabsTrigger>
          <TabsTrigger value="browse">Bladeren</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Teksten Vertalen</CardTitle>
              <CardDescription>
                Voer meerdere teksten in (één per regel) om automatisch te vertalen naar alle geselecteerde talen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="texts">Teksten (Nederlands)</Label>
                <Textarea
                  id="texts"
                  placeholder="Dashboard&#10;Klanten&#10;Projecten&#10;Instellingen&#10;..."
                  value={newTexts}
                  onChange={(e) => setNewTexts(e.target.value)}
                  rows={10}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {newTexts.split('\n').filter(t => t.trim()).length} teksten
                </p>
              </div>

              <div>
                <Label>Vertaal naar</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {languages
                    .filter(l => l.language_code !== 'nl')
                    .map(lang => (
                      <Badge
                        key={lang.language_code}
                        variant={selectedLanguages.includes(lang.language_code) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (selectedLanguages.includes(lang.language_code)) {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.language_code));
                          } else {
                            setSelectedLanguages([...selectedLanguages, lang.language_code]);
                          }
                        }}
                      >
                        {lang.flag_emoji} {lang.native_name}
                      </Badge>
                    ))}
                </div>
              </div>

              {loading && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>{currentOperation}</p>
                      <Progress value={progress} className="w-full" />
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={translateBulk}
                disabled={loading || !newTexts.trim() || selectedLanguages.length === 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Bezig met vertalen...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Vertaal {selectedLanguages.length} {selectedLanguages.length === 1 ? 'Taal' : 'Talen'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse">
          <Card>
            <CardHeader>
              <CardTitle>Bestaande Vertalingen</CardTitle>
              <CardDescription>
                Bekijk en beheer bestaande vertalingen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Coming soon: Browse en bewerk individuele vertalingen
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

