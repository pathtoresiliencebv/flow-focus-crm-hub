import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ExternalLink, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WebmailSettings {
  roundcube_url?: string;
  roundcube_enabled?: boolean;
  auto_login_enabled?: boolean;
}

export const RoundcubeWebmail: React.FC = () => {
  const [settings, setSettings] = useState<WebmailSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error) throw error;

      const webmailSettings: WebmailSettings = {
        roundcube_url: data?.roundcube_url || '',
        roundcube_enabled: data?.roundcube_enabled || false,
        auto_login_enabled: data?.auto_login_enabled || false,
      };

      setSettings(webmailSettings);
      setTempUrl(webmailSettings.roundcube_url || '');
    } catch (error) {
      console.error('Error loading webmail settings:', error);
      // Show setup mode if no settings exist
      setEditMode(true);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Validate URL
      if (tempUrl && !tempUrl.startsWith('http://') && !tempUrl.startsWith('https://')) {
        toast({
          title: "Ongeldige URL",
          description: "URL moet beginnen met http:// of https://",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          id: 1, // Single company settings record
          roundcube_url: tempUrl,
          roundcube_enabled: !!tempUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSettings({
        ...settings,
        roundcube_url: tempUrl,
        roundcube_enabled: !!tempUrl,
      });

      setEditMode(false);

      toast({
        title: "Instellingen opgeslagen",
        description: "Webmail configuratie is bijgewerkt",
      });
    } catch (error) {
      console.error('Error saving webmail settings:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Kon instellingen niet opslaan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Webmail laden...</p>
        </div>
      </div>
    );
  }

  // Show setup screen if not configured or in edit mode
  if (!settings.roundcube_url || editMode) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Roundcube Webmail Configuratie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Roundcube Setup Vereist:</strong> Roundcube Webmail moet extern gehost worden. 
                Dit is een PHP-applicatie die niet op Vercel kan draaien.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="roundcube_url">Roundcube URL</Label>
                <Input
                  id="roundcube_url"
                  type="url"
                  placeholder="https://webmail.smanscrm.nl"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  De volledige URL naar uw Roundcube installatie
                </p>
              </div>

              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">📋 Setup Instructies</h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Installeer Roundcube</strong> op een PHP-server:
                    <code className="block ml-6 mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs">
                      wget https://github.com/roundcube/roundcubemail/releases/download/1.6.5/roundcubemail-1.6.5-complete.tar.gz
                    </code>
                  </li>
                  <li>
                    <strong>Configureer IMAP</strong> in <code>config/config.inc.php</code>:
                    <code className="block ml-6 mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs font-mono">
                      $config['imap_host'] = 'ssl://imap.gmail.com:993';<br/>
                      $config['smtp_host'] = 'tls://smtp.gmail.com:587';<br/>
                      $config['smtp_user'] = '%u';<br/>
                      $config['smtp_pass'] = '%p';
                    </code>
                  </li>
                  <li>
                    <strong>Database Setup</strong> (MySQL/PostgreSQL vereist):
                    <code className="block ml-6 mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs font-mono">
                      CREATE DATABASE roundcubemail CHARACTER SET utf8mb4;<br/>
                      ./bin/initdb.sh --dir=SQL
                    </code>
                  </li>
                  <li>
                    <strong>Enable iframe embedding</strong> in Apache/Nginx config:
                    <code className="block ml-6 mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs">
                      Header set Content-Security-Policy "frame-ancestors 'self' https://smansonderhoud.vercel.app"
                    </code>
                  </li>
                  <li>Voer de <strong>Roundcube URL</strong> hierboven in en klik op Opslaan</li>
                </ol>
              </div>

              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100">💡 Alternatieve Opties</h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• <strong>Gmail Webmail:</strong> https://mail.google.com</li>
                  <li>• <strong>Outlook Webmail:</strong> https://outlook.office.com</li>
                  <li>• <strong>cPanel Webmail:</strong> Als je cPanel hosting hebt</li>
                  <li>• <strong>Eigen Hosting:</strong> DigitalOcean, Linode, of dedicated server</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={saveSettings} disabled={saving || !tempUrl}>
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
                {settings.roundcube_url && (
                  <Button variant="outline" onClick={() => {
                    setEditMode(false);
                    setTempUrl(settings.roundcube_url || '');
                  }}>
                    Annuleren
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📚 Roundcube Documentatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="https://github.com/roundcube/roundcubemail/blob/master/INSTALL" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Roundcube Installation Guide
            </a>
            <a 
              href="https://github.com/roundcube/roundcubemail/wiki/Configuration" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Roundcube Configuration Wiki
            </a>
            <a 
              href="https://github.com/roundcube/roundcubemail" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Roundcube GitHub Repository
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show webmail iframe if configured
  return (
    <div className="h-full flex flex-col">
      {/* Header with settings button */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Webmail</h2>
          <span className="text-sm text-muted-foreground">({settings.roundcube_url})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(settings.roundcube_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in nieuw tabblad
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Instellingen
          </Button>
        </div>
      </div>

      {/* Iframe wrapper for proper scrolling */}
      <div className="flex-1 iframe-wrapper">
        <iframe 
          src={settings.roundcube_url}
          title="Roundcube Webmail"
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
};

