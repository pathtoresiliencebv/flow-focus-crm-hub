import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailSettings {
  planning_email_enabled: boolean;
  planning_email_subject: string;
  planning_email_body: string;
  completion_email_enabled: boolean;
}

export function EmailNotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings>({
    planning_email_enabled: true,
    planning_email_subject: 'Uw project is ingepland',
    planning_email_body: `Beste {customer_name},

Uw project "{project_title}" is ingepland.

📅 Datum: {planning_date}
⏰ Tijd: {planning_time}
👷 Monteur: {monteur_name}
📍 Locatie: {project_location}

Wij zien u graag tegemoet!

Met vriendelijke groet,
SMANS BV`,
    completion_email_enabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching email notification settings...');
      
      const { data, error } = await supabase
        .from('email_notification_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        // If no settings exist yet, use defaults
        if (error.code === 'PGRST116') {
          console.log('No settings found, using defaults');
        } else {
          throw error;
        }
      }
      
      if (data) {
        console.log('Settings loaded:', data);
        setSettings({
          planning_email_enabled: data.planning_email_enabled,
          planning_email_subject: data.planning_email_subject,
          planning_email_body: data.planning_email_body,
          completion_email_enabled: data.completion_email_enabled,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Fout bij laden",
        description: "Kon instellingen niet laden. Standaardinstellingen worden gebruikt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving email notification settings...');
      
      const { error } = await supabase
        .from('email_notification_settings')
        .update(settings)
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) {
        console.error('Error saving settings:', error);
        throw error;
      }

      console.log('✅ Settings saved successfully');
      
      toast({
        title: "✅ Instellingen opgeslagen",
        description: "Email notificatie instellingen zijn bijgewerkt.",
      });
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      toast({
        title: "❌ Fout bij opslaan",
        description: error.message || "Er ging iets mis.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Instellingen laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-blue-600" />
          Email Notificaties
        </h2>
        <p className="text-gray-600 mt-1">
          Beheer automatische email notificaties naar klanten
        </p>
      </div>

      {/* Planning Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Project Gepland Email
            </span>
            <Switch
              checked={settings.planning_email_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, planning_email_enabled: checked }))
              }
            />
          </CardTitle>
          <CardDescription>
            Email die automatisch naar de klant wordt verstuurd wanneer een project wordt ingepland
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {settings.planning_email_enabled && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Beschikbare placeholders:</strong>
                  <br />
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {'{customer_name}'}, {'{project_title}'}, {'{planning_date}'}, 
                    {'{planning_time}'}, {'{monteur_name}'}, {'{project_location}'}
                  </code>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="planning-subject">Email Onderwerp</Label>
                <Input
                  id="planning-subject"
                  value={settings.planning_email_subject}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, planning_email_subject: e.target.value }))
                  }
                  placeholder="Uw project is ingepland"
                  className="font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="planning-body">Email Tekst</Label>
                <Textarea
                  id="planning-body"
                  value={settings.planning_email_body}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, planning_email_body: e.target.value }))
                  }
                  rows={12}
                  placeholder="Email body..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Gebruik placeholders voor dynamische content. De email wordt automatisch geformatteerd met SMANS BV styling.
                </p>
              </div>
            </>
          )}

          {!settings.planning_email_enabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Planning email notificaties zijn momenteel uitgeschakeld. 
                Schakel de toggle hierboven in om deze functie te activeren.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Completion Email Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Project Afgerond Email
            </span>
            <Switch
              checked={settings.completion_email_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, completion_email_enabled: checked }))
              }
            />
          </CardTitle>
          <CardDescription>
            Email met werkbon PDF die automatisch naar de klant wordt verstuurd wanneer een project wordt afgerond
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              De completion email wordt automatisch gegenereerd met de werkbon PDF bijlage. 
              De inhoud wordt bepaald door de werkbon template en bevat automatisch alle projectdetails, 
              foto's, materialen en handtekeningen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={fetchSettings}
          disabled={saving}
        >
          Annuleren
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            'Wijzigingen Opslaan'
          )}
        </Button>
      </div>
    </div>
  );
}

