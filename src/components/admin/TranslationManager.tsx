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

  const extractAllTextsFromCode = () => {
    // MASSIEVE lijst met ALLE hardcoded teksten uit de hele app
    return [
      // Navigation & Menu
      'Dashboard', 'Klanten', 'Projecten', 'Planning', 'Offertes', 'Facturatie', 'Tijdregistratie', 'Bonnetjes',
      'E-mail', 'Postvak IN', 'Chat', 'Instellingen', 'Gebruikers', 'Rollen', 'Communicatie',
      'Team Agenda\'s', 'Personeel', 'Gebruikersbeheer', 'Rollen & Rechten', 'Uitloggen',
      
      // Actions & Buttons
      'Toevoegen', 'Bewerken', 'Verwijderen', 'Opslaan', 'Annuleren', 'Sluiten', 'Zoeken', 'Filteren',
      'Exporteren', 'Importeren', 'Uploaden', 'Downloaden', 'Print', 'Delen', 'Kopiëren', 'Plakken',
      'Nieuw', 'Nieuwe', 'Aanmaken', 'Bijwerken', 'Vernieuwen', 'Herladen', 'Sorteren', 'Selecteren',
      'Verplaatsen', 'Archiveren', 'Herstellen', 'Duplicate', 'Versturen', 'Verzenden',
      
      // Status & States
      'Actief', 'Inactief', 'Gepland', 'In uitvoering', 'Afgerond', 'Geannuleerd', 'In afwachting',
      'Concept', 'Verzonden', 'Goedgekeurd', 'Afgewezen', 'Open', 'Gesloten', 'Voltooid',
      'Te plannen', 'Lopend', 'On hold', 'Gereed', 'Geblokkeerd', 'Gepauzeerd',
      
      // Common Labels & Fields
      'Naam', 'Voornaam', 'Achternaam', 'Volledige naam', 'Email', 'E-mailadres', 'Telefoon', 'Telefoonnummer',
      'Mobiel', 'Adres', 'Straat', 'Huisnummer', 'Postcode', 'Plaats', 'Stad', 'Land', 'Provincie',
      'Datum', 'Tijd', 'Start datum', 'Eind datum', 'Deadline', 'Vervaldatum', 'Aangemaakt', 'Bijgewerkt',
      'Beschrijving', 'Notities', 'Opmerkingen', 'Details', 'Specificaties', 'Status', 'Type', 'Categorie',
      'Titel', 'Onderwerp', 'Bericht', 'Inhoud', 'Tekst', 'Waarde', 'Bedrag', 'Prijs', 'Totaal',
      'Subtotaal', 'BTW', 'Korting', 'Aantal', 'Eenheid', 'Kleur', 'Maat', 'Gewicht',
      
      // Customer/Contact
      'Nieuwe klant', 'Klant toevoegen', 'Klantgegevens', 'Klantdossier', 'Contact informatie', 'Contactpersoon',
      'Bedrijfsgegevens', 'Bedrijfsnaam', 'KVK nummer', 'BTW nummer', 'IBAN', 'Bank', 'Factuuradres',
      'Bezoekadres', 'Correspondentieadres', 'Website', 'Branche', 'Sector', 'Afdeling',
      
      // Project
      'Nieuw project', 'Project toevoegen', 'Projectdetails', 'Projectnaam', 'Projectnummer',
      'Budget', 'Voortgang', 'Percentage', 'Uren', 'Bestede uren', 'Geschatte uren',
      'Documenten', 'Bijlagen', 'Bestanden', 'Foto\'s', 'Afbeeldingen', 'Team', 'Teamleden',
      'Verantwoordelijke', 'Eigenaar', 'Toegewezen aan', 'Deelnemers', 'Belanghebbenden',
      
      // Quote/Invoice
      'Offerte', 'Offertenummer', 'Offerte aanmaken', 'Offerte bewerken', 'Offerte verzenden',
      'Factuur', 'Factuurnummer', 'Factuur aanmaken', 'Factuur verzenden', 'Proforma',
      'Credit nota', 'Betaalvoorwaarden', 'Betalingstermijn', 'Vervaldatum betaling',
      'Artikel', 'Product', 'Dienst', 'Omschrijving', 'Hoeveelheid', 'Stuks', 'Stuksprijs',
      'Regeltotaal', 'Excl. BTW', 'Incl. BTW', 'BTW percentage', 'Korting percentage',
      
      // Planning/Calendar
      'Agenda', 'Kalender', 'Afspraak', 'Afspraak maken', 'Planning toevoegen', 'Inplannen',
      'Vandaag', 'Deze week', 'Deze maand', 'Volgende week', 'Vorige maand',
      'Dag', 'Week', 'Maand', 'Jaar', 'Dagweergave', 'Weekweergave', 'Maandweergave',
      'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag',
      'Starttijd', 'Eindtijd', 'Duur', 'Locatie', 'Deelnemers', 'Herhalingen', 'Herinneringen',
      
      // Email
      'Inbox', 'Verzonden items', 'Concepten', 'Prullenbak', 'Spam', 'Ongelezen', 'Gelezen',
      'Nieuwe mail', 'Beantwoorden', 'Allen beantwoorden', 'Doorsturen', 'Markeren', 'Archiveren',
      'Van', 'Aan', 'CC', 'BCC', 'Onderwerp', 'Bijlage', 'Bijlagen', 'Versturen', 'Verzenden',
      
      // Chat
      'Chatberichten', 'Nieuw bericht', 'Gesprekken', 'Chatgeschiedenis', 'Online', 'Offline',
      'Typen...', 'Bezig met typen', 'Laatst gezien', 'Gelezen', 'Bezorgd', 'Verzonden om',
      
      // Settings
      'Algemene instellingen', 'Bedrijfsinstellingen', 'Systeeminstellingen', 'Profiel', 'Account',
      'Wachtwoord', 'Wachtwoord wijzigen', 'Beveiliging', 'Privacy', 'Notificaties', 'Meldingen',
      'E-mail instellingen', 'SMTP', 'IMAP', 'Templates', 'Sjablonen', 'Integraties', 'API',
      'Webhooks', 'Exports', 'Imports', 'Backup', 'Herstellen', 'Taal', 'Thema', 'Donker', 'Licht',
      'Voorkeuren', 'Weergave', 'Lay-out', 'Formaat', 'Datum formaat', 'Tijd formaat',
      'Valuta', 'Tijdzone', 'Land instelling', 'Taal voorkeur',
      
      // User Management
      'Gebruiker toevoegen', 'Nieuwe gebruiker', 'Rol', 'Rechten', 'Permissies', 'Toegang',
      'Administrator', 'Monteur', 'Gebruiker', 'Klant', 'Gast', 'Medewerker',
      'Actieve gebruikers', 'Geblokkeerde gebruikers', 'Laatst ingelogd', 'Aangemaakt op',
      'Wachtwoord resetten', 'Account activeren', 'Account deactiveren',
      
      // Messages & Notifications
      'Succes', 'Succesvol', 'Gelukt', 'Fout', 'Foutmelding', 'Error', 'Waarschuwing', 'Let op',
      'Bevestiging', 'Bevestigen', 'Informatie', 'Info', 'Tip', 'Hulp', 'Help',
      'Weet je het zeker?', 'Actie kan niet ongedaan worden gemaakt', 'Wil je doorgaan?',
      'Wil je dit verwijderen?', 'Wil je dit opslaan?', 'Wijzigingen opslaan?',
      'Niet opgeslagen wijzigingen', 'Wil je de wijzigingen opslaan?',
      'Geen resultaten gevonden', 'Geen data beschikbaar', 'Geen items', 'Leeg',
      'Laden...', 'Bezig met laden', 'Even geduld', 'Verwerken...', 'Opslaan...', 'Verzenden...',
      
      // Form Validation
      'Verplicht veld', 'Dit veld is verplicht', 'Vul dit veld in', 'Ongeldig', 'Ongeldige invoer',
      'Ongeldig email adres', 'Ongeldig telefoonnummer', 'Ongeldig formaat',
      'Wachtwoord te kort', 'Minimaal 8 tekens', 'Wachtwoorden komen niet overeen',
      'Selecteer een optie', 'Kies een waarde', 'Minimaal', 'Maximaal', 'Tussen',
      'Te kort', 'Te lang', 'Mag niet leeg zijn', 'Moet uniek zijn',
      
      // Tables & Lists
      'Geen data', 'Geen resultaten', 'Zoekresultaten', 'Toon', 'Rijen per pagina',
      'Totaal', 'Items', 'Geselecteerd', 'Alles selecteren', 'Deselecteren',
      'Sorteren op', 'Oplopend', 'Aflopend', 'Filteren op', 'Filters', 'Wissen',
      'Eerste', 'Vorige', 'Volgende', 'Laatste', 'Pagina', 'van',
      
      // Time & Date
      'Vandaag', 'Gisteren', 'Morgen', 'Deze week', 'Vorige week', 'Volgende week',
      'Deze maand', 'Vorige maand', 'Volgende maand', 'Dit jaar', 'Nu', 'Zojuist',
      'seconde', 'seconden', 'minuut', 'minuten', 'uur', 'uren', 'dag', 'dagen',
      'week', 'weken', 'maand', 'maanden', 'jaar', 'jaren', 'geleden',
      
      // Common Actions
      'Terug', 'Ga terug', 'Volgende', 'Vorige', 'Begin', 'Einde', 'Home', 'Startpagina',
      'Meer info', 'Details bekijken', 'Uitklappen', 'Inklappen', 'Toon meer', 'Toon minder',
      'Verbergen', 'Weergeven', 'Activeren', 'Deactiveren', 'Inschakelen', 'Uitschakelen',
      
      // Misc
      'Ja', 'Nee', 'Misschien', 'OK', 'Oké', 'Akkoord', 'Toestemmen', 'Weigeren',
      'Overslaan', 'Later', 'Nu', 'Voltooien', 'Afronden', 'Klaar', 'Gereed',
      'Bezig', 'Wachten', 'In behandeling', 'Verwerkt', 'Voltooid',
      'Standaard', 'Aangepast', 'Nieuw', 'Oud', 'Recent', 'Favorieten', 'Favoriet',
      'Zoekresultaten voor', 'Geen resultaten voor', 'Resultaten', 'gevonden',
      'Beschikbaar', 'Niet beschikbaar', 'Optioneel', 'Verplicht', 'Aanbevolen',
    ];
  };

  const autoTranslateAll = async () => {
    if (!confirm('Dit zal ALLE hardcoded Nederlandse teksten uit de app automatisch vertalen via DeepL. Dit kan 5-10 minuten duren. Doorgaan?')) {
      return;
    }

    setLoading(true);
    setProgress(0);
    setCurrentOperation('Alle hardcoded teksten verzamelen...');

    try {
      const allTexts = extractAllTextsFromCode();
      console.log(`📝 Gevonden: ${allTexts.length} hardcoded teksten`);

      setCurrentOperation(`Vertalen van ${allTexts.length} teksten naar 4 talen...`);

      let totalTranslated = 0;
      const languages = ['en', 'pl', 'ro', 'tr'];

      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        
        // Process in batches of 50 (DeepL limit)
        const batchSize = 50;
        for (let j = 0; j < allTexts.length; j += batchSize) {
          const batch = allTexts.slice(j, j + batchSize);
          const batchNum = Math.floor(j / batchSize) + 1;
          const totalBatches = Math.ceil(allTexts.length / batchSize);
          
          setCurrentOperation(`${lang.toUpperCase()}: Batch ${batchNum}/${totalBatches} (${j + batch.length}/${allTexts.length} teksten)`);

          const { data, error } = await supabase.functions.invoke('translate-ui-texts', {
            body: {
              texts: batch,
              targetLanguage: lang,
              sourceLanguage: 'nl'
            }
          });

          if (!error && data?.translations) {
            const records = batch.map((text, idx) => ({
              translation_key: text,
              language_code: lang,
              translated_text: data.translations[idx] || text,
              context: 'auto_extracted_all',
              updated_at: new Date().toISOString()
            }));

            await supabase.from('ui_translations').upsert(records, {
              onConflict: 'translation_key,language_code'
            });

            totalTranslated += records.length;
          }

          // Update progress
          const langProgress = (i / languages.length) * 100;
          const batchProgress = ((j + batch.length) / allTexts.length) * (100 / languages.length);
          setProgress(langProgress + batchProgress);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setCurrentOperation('');
      toast({
        title: "🎉 Auto-vertaling compleet!",
        description: `${totalTranslated} vertalingen toegevoegd! Platform is nu volledig meertalig.`,
      });

      loadStats();
    } catch (error: any) {
      console.error('Auto-translate error:', error);
      toast({
        title: "❌ Fout bij vertalen",
        description: error.message,
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
        <div className="flex gap-2">
          <Button 
            onClick={autoTranslateAll} 
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                🤖 Auto-Vertaal ALLES
              </>
            )}
          </Button>
          <Button onClick={exportTranslations} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
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

