import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, XCircle, Clock, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailConfig {
  id: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  imap_use_ssl: boolean;
  is_active: boolean;
  last_check_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  check_interval_minutes: number;
}

export const EmailSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState({
    email_address: 'bonnetjes@smanscrm.nl',
    imap_host: '',
    imap_port: 993,
    imap_username: '',
    imap_password: '',
    imap_use_ssl: true,
    is_active: true,
    check_interval_minutes: 5,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipt_email_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        // Check if table doesn't exist (42P01 = undefined_table)
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('⚠️ receipt_email_config table does not exist. Run migration: 20251009000000_receipt_enhancements.sql');
          toast({
            title: 'Database migratie vereist',
            description: 'De email configuratie tabel bestaat nog niet. Neem contact op met de beheerder.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data) {
        setConfig(data);
        setFormData({
          email_address: data.email_address,
          imap_host: data.imap_host,
          imap_port: data.imap_port,
          imap_username: data.imap_username,
          imap_password: '••••••••', // Don't show real password
          imap_use_ssl: data.imap_use_ssl,
          is_active: data.is_active,
          check_interval_minutes: data.check_interval_minutes,
        });
      }
    } catch (error: any) {
      console.error('Error loading email config:', error);
      toast({
        title: 'Fout bij laden',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const configData = {
        email_address: formData.email_address,
        imap_host: formData.imap_host,
        imap_port: formData.imap_port,
        imap_username: formData.imap_username,
        // Only update password if it's been changed
        ...(formData.imap_password !== '••••••••' && {
          imap_password: formData.imap_password,
        }),
        imap_use_ssl: formData.imap_use_ssl,
        is_active: formData.is_active,
        check_interval_minutes: formData.check_interval_minutes,
        updated_at: new Date().toISOString(),
      };

      if (config?.id) {
        // Update existing config
        const { error } = await supabase
          .from('receipt_email_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Create new config
        const { error } = await supabase
          .from('receipt_email_config')
          .insert({
            ...configData,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast({
        title: 'Opgeslagen',
        description: 'Email configuratie is succesvol opgeslagen',
      });

      setIsEditing(false);
      loadConfig();
    } catch (error: any) {
      console.error('Error saving email config:', error);
      toast({
        title: 'Fout bij opslaan',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // In production, this would call an Edge Function to test the IMAP connection
      // For now, we'll simulate it
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Verbinding getest',
        description: '✅ Email configuratie werkt (simulatie)',
      });
    } catch (error: any) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Verbinding mislukt',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTriggerCheck = async () => {
    try {
      // Trigger the Edge Function to check for new emails
      const { error } = await supabase.functions.invoke('process-receipt-emails');

      if (error) throw error;

      toast({
        title: 'Controle gestart',
        description: 'Email inbox wordt nu gecontroleerd op nieuwe bonnetjes',
      });

      // Reload config to see updated last_check_at
      setTimeout(loadConfig, 2000);
    } catch (error: any) {
      console.error('Error triggering email check:', error);
      toast({
        title: 'Fout bij controle',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Nooit';
    const date = new Date(dateString);
    return date.toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Email Instellingen</h2>
          <p className="text-gray-600 mt-1">
            Configureer automatische ontvangst van bonnetjes via email
          </p>
        </div>
        {!isEditing && config && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Bewerken
          </Button>
        )}
      </div>

      {/* Status Card */}
      {config && (
        <Card className={config.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {config.is_active ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="font-semibold">
                    {config.is_active ? 'Email ontvangst is actief' : 'Email ontvangst is gepauzeerd'}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Laatste controle: {formatDate(config.last_check_at)}
                    </span>
                    {config.last_success_at && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Laatste succes: {formatDate(config.last_success_at)}
                      </span>
                    )}
                  </div>
                  {config.last_error && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {config.last_error}
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={handleTriggerCheck}
                variant="outline"
                size="sm"
                disabled={!config.is_active}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Nu Controleren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuratie
          </CardTitle>
          <CardDescription>
            IMAP instellingen voor bonnetjes@smanscrm.nl
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email_address">Email Adres</Label>
            <Input
              id="email_address"
              value={formData.email_address}
              onChange={(e) =>
                setFormData({ ...formData, email_address: e.target.value })
              }
              disabled={!isEditing}
              placeholder="bonnetjes@smanscrm.nl"
            />
          </div>

          {/* IMAP Host */}
          <div className="space-y-2">
            <Label htmlFor="imap_host">IMAP Server</Label>
            <Input
              id="imap_host"
              value={formData.imap_host}
              onChange={(e) =>
                setFormData({ ...formData, imap_host: e.target.value })
              }
              disabled={!isEditing}
              placeholder="imap.gmail.com"
            />
          </div>

          {/* IMAP Port & SSL */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imap_port">IMAP Poort</Label>
              <Input
                id="imap_port"
                type="number"
                value={formData.imap_port}
                onChange={(e) =>
                  setFormData({ ...formData, imap_port: parseInt(e.target.value) })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>SSL/TLS</Label>
              <div className="flex items-center h-10">
                <Switch
                  checked={formData.imap_use_ssl}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, imap_use_ssl: checked })
                  }
                  disabled={!isEditing}
                />
                <span className="ml-2 text-sm">
                  {formData.imap_use_ssl ? 'Ingeschakeld' : 'Uitgeschakeld'}
                </span>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="imap_username">Gebruikersnaam</Label>
            <Input
              id="imap_username"
              value={formData.imap_username}
              onChange={(e) =>
                setFormData({ ...formData, imap_username: e.target.value })
              }
              disabled={!isEditing}
              placeholder="bonnetjes@smanscrm.nl"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="imap_password">Wachtwoord</Label>
            <Input
              id="imap_password"
              type="password"
              value={formData.imap_password}
              onChange={(e) =>
                setFormData({ ...formData, imap_password: e.target.value })
              }
              disabled={!isEditing}
              placeholder="••••••••"
            />
          </div>

          {/* Check Interval */}
          <div className="space-y-2">
            <Label htmlFor="check_interval">Controle Interval (minuten)</Label>
            <Input
              id="check_interval"
              type="number"
              value={formData.check_interval_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  check_interval_minutes: parseInt(e.target.value),
                })
              }
              disabled={!isEditing}
            />
            <p className="text-xs text-gray-500">
              Hoe vaak de inbox wordt gecontroleerd (aanbevolen: 5 minuten)
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Email ontvangst actief</Label>
              <p className="text-sm text-gray-500">
                Schakel automatische email controle in of uit
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
              disabled={!isEditing}
            />
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  loadConfig(); // Reset form
                }}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleTestConnection}
                variant="outline"
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testen...
                  </>
                ) : (
                  'Test Verbinding'
                )}
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)]"
              >
                Opslaan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 space-y-2">
          <p className="font-semibold text-blue-900">💡 Hoe werkt het?</p>
          <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
            <li>Monteurs sturen bonnetjes naar <strong>{formData.email_address}</strong></li>
            <li>Systeem controleert elke {formData.check_interval_minutes} minuten de inbox</li>
            <li>Bijlagen (foto's/PDF's) worden automatisch geüpload</li>
            <li>Bonnetjes die aan goedkeuringsregels voldoen worden automatisch goedgekeurd</li>
            <li>Monteur ontvangt email bevestiging bij goedkeuring/afwijzing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

