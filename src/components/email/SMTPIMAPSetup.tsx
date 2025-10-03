/**
 * SMTP/IMAP Setup Component
 * 
 * Allows users to configure email accounts with SMTP/IMAP settings
 * Replaces Gmail OAuth setup with flexible provider-agnostic configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Server, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Info,
  ExternalLink
} from 'lucide-react';
import { 
  EMAIL_PRESETS, 
  getPresetById, 
  detectProviderFromEmail,
  validateEmailConfig,
  getRecommendedEncryption,
  type EmailPreset,
  type ValidationError
} from '@/lib/emailPresets';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SMTPIMAPSetupProps {
  accountId?: string; // For editing existing account
  onSuccess?: (accountId: string) => void;
  onCancel?: () => void;
}

export const SMTPIMAPSetup: React.FC<SMTPIMAPSetupProps> = ({
  accountId,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [emailAddress, setEmailAddress] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // SMTP state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpEncryption, setSmtpEncryption] = useState<'tls' | 'ssl' | 'none'>('tls');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  
  // IMAP state
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [imapUsername, setImapUsername] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [imapEncryption, setImapEncryption] = useState<'ssl' | 'tls' | 'none'>('ssl');
  const [showImapPassword, setShowImapPassword] = useState(false);
  
  // UI state
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [currentStep, setCurrentStep] = useState<'preset' | 'smtp' | 'imap' | 'test'>('preset');

  // Load existing account if editing
  useEffect(() => {
    if (accountId) {
      loadAccount();
    }
  }, [accountId]);

  const loadAccount = async () => {
    if (!accountId) return;

    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) {
      toast({
        title: 'Fout bij laden',
        description: 'Kon email account niet laden',
        variant: 'destructive'
      });
      return;
    }

    if (data) {
      setEmailAddress(data.email_address);
      setDisplayName(data.display_name || '');
      setSmtpHost(data.smtp_host || '');
      setSmtpPort(data.smtp_port || 587);
      setSmtpUsername(data.smtp_username || '');
      setSmtpEncryption(data.smtp_encryption as any || 'tls');
      setImapHost(data.imap_host || '');
      setImapPort(data.imap_port || 993);
      setImapUsername(data.imap_username || '');
      setImapEncryption(data.imap_encryption as any || 'ssl');
      // Note: passwords are not loaded (security)
    }
  };

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = getPresetById(presetId);
    
    if (preset && preset.id !== 'custom') {
      setSmtpHost(preset.smtp.host);
      setSmtpPort(preset.smtp.port);
      setSmtpEncryption(preset.smtp.encryption);
      setImapHost(preset.imap.host);
      setImapPort(preset.imap.port);
      setImapEncryption(preset.imap.encryption);
      
      // Auto-fill usernames if email is set
      if (emailAddress) {
        setSmtpUsername(emailAddress);
        setImapUsername(emailAddress);
      }
    }
  };

  // Auto-detect provider from email
  const handleEmailChange = (email: string) => {
    setEmailAddress(email);
    
    // Auto-detect provider
    const detected = detectProviderFromEmail(email);
    if (detected && selectedPreset === 'custom') {
      handlePresetSelect(detected.id);
      toast({
        title: 'Provider gedetecteerd',
        description: `We hebben ${detected.name} instellingen vooringevuld`,
      });
    }
    
    // Auto-fill usernames
    setSmtpUsername(email);
    setImapUsername(email);
  };

  // Test connection
  const handleTest = async () => {
    // Validate first
    const errors = validateEmailConfig({
      smtp: { host: smtpHost, port: smtpPort, encryption: smtpEncryption },
      imap: { host: imapHost, port: imapPort, encryption: imapEncryption },
      smtpUsername,
      smtpPassword,
      imapUsername,
      imapPassword,
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: 'Validatie fout',
        description: 'Controleer de ingevulde gegevens',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-email-connection', {
        body: {
          smtp: {
            host: smtpHost,
            port: smtpPort,
            username: smtpUsername,
            password: smtpPassword,
            encryption: smtpEncryption,
          },
          imap: {
            host: imapHost,
            port: imapPort,
            username: imapUsername,
            password: imapPassword,
            encryption: imapEncryption,
          },
          testEmail: emailAddress, // Send test email to self
        },
      });

      if (error) throw error;

      setTestResult(data);

      if (data.success) {
        toast({
          title: '✅ Verbinding succesvol',
          description: 'SMTP en IMAP verbindingen werken!',
        });
      } else {
        toast({
          title: '❌ Verbinding mislukt',
          description: 'Controleer je instellingen en probeer opnieuw',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Test fout',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  // Save account
  const handleSave = async () => {
    // Validate
    const errors = validateEmailConfig({
      smtp: { host: smtpHost, port: smtpPort, encryption: smtpEncryption },
      imap: { host: imapHost, port: imapPort, encryption: imapEncryption },
      smtpUsername,
      smtpPassword,
      imapUsername,
      imapPassword,
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);

    try {
      // Use Edge Function to save account with encrypted passwords
      const { data: result, error } = await supabase.functions.invoke('save-email-account', {
        body: {
          accountId: accountId || undefined,
          emailAddress: emailAddress,
          displayName: displayName || emailAddress.split('@')[0],
          smtpHost,
          smtpPort,
          smtpUsername,
          smtpPassword, // Will be encrypted server-side
          smtpEncryption,
          imapHost,
          imapPort,
          imapUsername,
          imapPassword, // Will be encrypted server-side
          imapEncryption,
          syncEnabled: true,
          connectionStatus: testResult?.success ? 'connected' : 'configured',
          isActive: true,
        },
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || 'Failed to save account');

      toast({
        title: '✅ Account opgeslagen',
        description: 'Email account is succesvol geconfigureerd',
      });

      if (onSuccess && result.data) {
        onSuccess(result.data.id);
      }
      
      // Refresh the page to load the account
      window.location.reload();
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Opslaan mislukt',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const currentPreset = getPresetById(selectedPreset);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {accountId ? 'Email Account Bewerken' : 'Email Account Toevoegen'}
        </h2>
        <p className="text-gray-500 mt-1">
          Configureer je email account met SMTP/IMAP instellingen
        </p>
      </div>

      {/* Preset Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Stap 1: Selecteer Provider
          </CardTitle>
          <CardDescription>
            Kies je email provider voor vooringevulde instellingen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(EMAIL_PRESETS).filter(p => p.id !== 'custom').map(preset => (
              <Button
                key={preset.id}
                variant={selectedPreset === preset.id ? 'default' : 'outline'}
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handlePresetSelect(preset.id)}
              >
                <span className="text-sm font-medium">{preset.name}</span>
                {preset.requiresAppPassword && (
                  <Badge variant="secondary" className="text-xs">
                    App wachtwoord
                  </Badge>
                )}
              </Button>
            ))}
            <Button
              variant={selectedPreset === 'custom' ? 'default' : 'outline'}
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handlePresetSelect('custom')}
            >
              <span className="text-sm font-medium">Aangepast</span>
            </Button>
          </div>

          {/* Instructions */}
          {currentPreset?.instructions && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Setup Instructies</AlertTitle>
              <AlertDescription className="mt-2 text-sm whitespace-pre-line">
                {currentPreset.instructions}
              </AlertDescription>
              {currentPreset.setupUrl && (
                <a
                  href={currentPreset.setupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  Meer informatie
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </Alert>
          )}

          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email-address">Email Adres *</Label>
            <Input
              id="email-address"
              type="email"
              placeholder="naam@bedrijf.nl"
              value={emailAddress}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Weergave Naam (optioneel)</Label>
            <Input
              id="display-name"
              type="text"
              placeholder="Jouw Naam"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMTP & IMAP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Stap 2: Server Instellingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="smtp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="smtp">SMTP (Verzenden)</TabsTrigger>
              <TabsTrigger value="imap">IMAP (Ontvangen)</TabsTrigger>
            </TabsList>

            {/* SMTP Tab */}
            <TabsContent value="smtp" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Server *</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Poort *</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value) || 587)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-username">Gebruikersnaam *</Label>
                <Input
                  id="smtp-username"
                  placeholder="naam@bedrijf.nl"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-password">Wachtwoord *</Label>
                <div className="relative">
                  <Input
                    id="smtp-password"
                    type={showSmtpPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  >
                    {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-encryption">Versleuteling *</Label>
                <Select value={smtpEncryption} onValueChange={(v: any) => setSmtpEncryption(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tls">TLS (aanbevolen voor poort 587)</SelectItem>
                    <SelectItem value="ssl">SSL (aanbevolen voor poort 465)</SelectItem>
                    <SelectItem value="none">Geen (niet aanbevolen)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* IMAP Tab */}
            <TabsContent value="imap" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imap-host">IMAP Server *</Label>
                  <Input
                    id="imap-host"
                    placeholder="imap.gmail.com"
                    value={imapHost}
                    onChange={(e) => setImapHost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap-port">Poort *</Label>
                  <Input
                    id="imap-port"
                    type="number"
                    placeholder="993"
                    value={imapPort}
                    onChange={(e) => setImapPort(parseInt(e.target.value) || 993)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-username">Gebruikersnaam *</Label>
                <Input
                  id="imap-username"
                  placeholder="naam@bedrijf.nl"
                  value={imapUsername}
                  onChange={(e) => setImapUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-password">Wachtwoord *</Label>
                <div className="relative">
                  <Input
                    id="imap-password"
                    type={showImapPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={imapPassword}
                    onChange={(e) => setImapPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowImapPassword(!showImapPassword)}
                  >
                    {showImapPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-encryption">Versleuteling *</Label>
                <Select value={imapEncryption} onValueChange={(v: any) => setImapEncryption(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssl">SSL (aanbevolen voor poort 993)</SelectItem>
                    <SelectItem value="tls">TLS (aanbevolen voor poort 143)</SelectItem>
                    <SelectItem value="none">Geen (niet aanbevolen)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validatie Fouten</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, i) => (
                <li key={i}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Test Result */}
      {testResult && (
        <Alert variant={testResult.success ? 'default' : 'destructive'}>
          {testResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {testResult.success ? 'Verbinding Succesvol' : 'Verbinding Mislukt'}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2">
              {testResult.results?.smtp && (
                <div className="text-sm">
                  <strong>SMTP:</strong> {testResult.results.smtp.message}
                </div>
              )}
              {testResult.results?.imap && (
                <div className="text-sm">
                  <strong>IMAP:</strong> {testResult.results.imap.message}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testing || !emailAddress || !smtpHost || !imapHost}
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testen...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Test Verbinding
            </>
          )}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !emailAddress || !smtpHost || !imapHost}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Opslaan & Activeren
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

