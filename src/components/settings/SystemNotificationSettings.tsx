import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, MessageSquare, Send, CheckCircle, XCircle, Server, Bell, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SystemSettings {
  // SMTP
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_test_email: string | null;
  smtp_last_test_at: string | null;
  smtp_last_test_success: boolean | null;
  smtp_last_test_error: string | null;
  
  // SMS
  sms_enabled: boolean;
  sms_provider: string;
  sms_from_number: string | null;
  sms_test_number: string | null;
  sms_last_test_at: string | null;
  sms_last_test_success: boolean | null;
  sms_last_test_error: string | null;
  
  // Notification toggles
  notify_planning_email: boolean;
  notify_planning_sms: boolean;
  notify_completion_email: boolean;
  notify_completion_sms: boolean;
  notify_receipt_approval_email: boolean;
  notify_quote_approval_email: boolean;
  notify_invoice_sent_email: boolean;
}

export function SystemNotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    smtp_enabled: true,
    smtp_host: 'smtp.hostnet.nl',
    smtp_port: 587,
    smtp_secure: false,
    smtp_user: 'info@smansonderhoud.nl',
    smtp_from_email: 'info@smansonderhoud.nl',
    smtp_from_name: 'SMANS Onderhoud',
    smtp_test_email: null,
    smtp_last_test_at: null,
    smtp_last_test_success: null,
    smtp_last_test_error: null,
    sms_enabled: false,
    sms_provider: 'messagebird',
    sms_from_number: null,
    sms_test_number: null,
    sms_last_test_at: null,
    sms_last_test_success: null,
    sms_last_test_error: null,
    notify_planning_email: true,
    notify_planning_sms: false,
    notify_completion_email: true,
    notify_completion_sms: false,
    notify_receipt_approval_email: true,
    notify_quote_approval_email: true,
    notify_invoice_sent_email: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_notification_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        if (error.code !== 'PGRST116') {
          throw error;
        }
      }
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fout bij laden",
        description: "Kon instellingen niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_notification_settings')
        .update(settings)
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;

      toast({
        title: "✅ Opgeslagen",
        description: "Notificatie instellingen zijn bijgewerkt.",
      });
    } catch (error: any) {
      toast({
        title: "❌ Fout",
        description: error.message || "Kon niet opslaan.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testSmtp = async () => {
    if (!settings.smtp_test_email) {
      toast({
        title: "⚠️ Test email vereist",
        description: "Voer een test email adres in om SMTP te testen.",
        variant: "destructive",
      });
      return;
    }

    setTestingSmtp(true);
    try {
      console.log('🧪 Testing SMTP connection...');
      
      // Call Edge Function to test SMTP
      const { data, error } = await supabase.functions.invoke('test-smtp-connection', {
        body: {
          testEmail: settings.smtp_test_email
        }
      });

      if (error) {
        throw error;
      }

      // Update settings with test result
      const updatedSettings = {
        ...settings,
        smtp_last_test_at: new Date().toISOString(),
        smtp_last_test_success: data?.success || false,
        smtp_last_test_error: data?.error || null
      };
      setSettings(updatedSettings);

      // Save to database
      await supabase
        .from('system_notification_settings')
        .update(updatedSettings)
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (data?.success) {
        toast({
          title: "✅ SMTP Test Geslaagd",
          description: `Test email verzonden naar ${settings.smtp_test_email}`,
        });
      } else {
        throw new Error(data?.error || 'SMTP test failed');
      }
    } catch (error: any) {
      toast({
        title: "❌ SMTP Test Mislukt",
        description: error.message || "Kon geen verbinding maken met SMTP server.",
        variant: "destructive",
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const testSms = async () => {
    if (!settings.sms_test_number) {
      toast({
        title: "⚠️ Test nummer vereist",
        description: "Voer een test telefoonnummer in om SMS te testen.",
        variant: "destructive",
      });
      return;
    }

    setTestingSms(true);
    try {
      console.log('🧪 Testing SMS connection...');
      
      const { data, error } = await supabase.functions.invoke('test-sms-connection', {
        body: {
          testNumber: settings.sms_test_number
        }
      });

      if (error) throw error;

      const updatedSettings = {
        ...settings,
        sms_last_test_at: new Date().toISOString(),
        sms_last_test_success: data?.success || false,
        sms_last_test_error: data?.error || null
      };
      setSettings(updatedSettings);

      await supabase
        .from('system_notification_settings')
        .update(updatedSettings)
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (data?.success) {
        toast({
          title: "✅ SMS Test Geslaagd",
          description: `Test SMS verzonden naar ${settings.sms_test_number}`,
        });
      } else {
        throw new Error(data?.error || 'SMS test failed');
      }
    } catch (error: any) {
      toast({
        title: "❌ SMS Test Mislukt",
        description: error.message || "Kon geen SMS versturen.",
        variant: "destructive",
      });
    } finally {
      setTestingSms(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Server className="h-6 w-6 text-blue-600" />
          Systeem Notificaties
        </h2>
        <p className="text-muted-foreground mt-1">
          Configureer SMTP, SMS en notificatie instellingen
        </p>
      </div>

      <Tabs defaultValue="smtp">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="smtp">
            <Mail className="h-4 w-4 mr-2" />
            SMTP Email
          </TabsTrigger>
          <TabsTrigger value="sms">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificaties
          </TabsTrigger>
        </TabsList>

        {/* SMTP Settings */}
        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SMTP Configuratie</span>
                <Switch
                  checked={settings.smtp_enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, smtp_enabled: checked }))
                  }
                />
              </CardTitle>
              <CardDescription>
                Instellingen voor email verzending via SMTP server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.smtp_enabled && (
                <>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Let op:</strong> SMTP credentials worden veilig opgeslagen in Supabase Secrets.
                      <br />API keys: <code className="bg-muted px-1">SMANS_SMTP_API_KEY</code>, <code className="bg-muted px-1">SMANS_SMTP_PASSWORD</code>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>SMTP Server</Label>
                      <Input
                        value={settings.smtp_host}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, smtp_host: e.target.value }))
                        }
                        placeholder="smtp.hostnet.nl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SMTP Port</Label>
                      <Input
                        type="number"
                        value={settings.smtp_port}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, smtp_port: parseInt(e.target.value) }))
                        }
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input
                      value={settings.smtp_user}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, smtp_user: e.target.value }))
                      }
                      placeholder="info@smansonderhoud.nl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Van Email</Label>
                      <Input
                        value={settings.smtp_from_email}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, smtp_from_email: e.target.value }))
                        }
                        placeholder="info@smansonderhoud.nl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Van Naam</Label>
                      <Input
                        value={settings.smtp_from_name}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, smtp_from_name: e.target.value }))
                        }
                        placeholder="SMANS Onderhoud"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.smtp_secure}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, smtp_secure: checked }))
                      }
                    />
                    <Label>STARTTLS gebruiken (aanbevolen voor port 587)</Label>
                  </div>

                  <Separator />

                  {/* SMTP Test */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Test SMTP Verbinding
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={settings.smtp_test_email || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, smtp_test_email: e.target.value }))
                        }
                        placeholder="Test email adres"
                        className="flex-1"
                      />
                      <Button onClick={testSmtp} disabled={testingSmtp}>
                        {testingSmtp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testen...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Test
                          </>
                        )}
                      </Button>
                    </div>

                    {settings.smtp_last_test_at && (
                      <Alert className={settings.smtp_last_test_success ? 'border-green-500' : 'border-red-500'}>
                        {settings.smtp_last_test_success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription>
                          <strong>
                            {settings.smtp_last_test_success ? 'Test Geslaagd' : 'Test Mislukt'}
                          </strong>
                          <br />
                          Laatste test: {new Date(settings.smtp_last_test_at).toLocaleString('nl-NL')}
                          {settings.smtp_last_test_error && (
                            <>
                              <br />
                              <span className="text-sm text-red-600">{settings.smtp_last_test_error}</span>
                            </>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}

              {!settings.smtp_enabled && (
                <Alert>
                  <AlertDescription>
                    SMTP email verzending is uitgeschakeld. Schakel in om emails te versturen.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Settings */}
        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SMS Configuratie</span>
                <Switch
                  checked={settings.sms_enabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, sms_enabled: checked }))
                  }
                />
              </CardTitle>
              <CardDescription>
                Instellingen voor SMS notificaties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.sms_enabled && (
                <>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Let op:</strong> SMS API key wordt opgeslagen in Supabase Secret: <code className="bg-muted px-1">SMS_API_KEY</code>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>SMS Provider</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={settings.sms_provider}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, sms_provider: e.target.value }))
                      }
                    >
                      <option value="messagebird">MessageBird</option>
                      <option value="twilio">Twilio</option>
                      <option value="nexmo">Vonage (Nexmo)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Van Nummer</Label>
                    <Input
                      value={settings.sms_from_number || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, sms_from_number: e.target.value }))
                      }
                      placeholder="+31612345678"
                    />
                  </div>

                  <Separator />

                  {/* SMS Test */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Test SMS Verbinding
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        value={settings.sms_test_number || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, sms_test_number: e.target.value }))
                        }
                        placeholder="+31612345678"
                        className="flex-1"
                      />
                      <Button onClick={testSms} disabled={testingSms}>
                        {testingSms ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testen...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Test
                          </>
                        )}
                      </Button>
                    </div>

                    {settings.sms_last_test_at && (
                      <Alert className={settings.sms_last_test_success ? 'border-green-500' : 'border-red-500'}>
                        {settings.sms_last_test_success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription>
                          <strong>
                            {settings.sms_last_test_success ? 'Test Geslaagd' : 'Test Mislukt'}
                          </strong>
                          <br />
                          Laatste test: {new Date(settings.sms_last_test_at).toLocaleString('nl-NL')}
                          {settings.sms_last_test_error && (
                            <>
                              <br />
                              <span className="text-sm text-red-600">{settings.sms_last_test_error}</span>
                            </>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}

              {!settings.sms_enabled && (
                <Alert>
                  <AlertDescription>
                    SMS notificaties zijn uitgeschakeld. Schakel in om SMS berichten te versturen.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Toggles */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notificatie Types</CardTitle>
              <CardDescription>
                Beheer welke notificaties automatisch worden verstuurd
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Planning Notifications */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">PROJECT GEPLAND</h4>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Email naar klant</p>
                    <p className="text-sm text-muted-foreground">Bij planning toewijzing</p>
                  </div>
                  <Switch
                    checked={settings.notify_planning_email}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, notify_planning_email: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">SMS naar klant</p>
                    <p className="text-sm text-muted-foreground">Bij planning toewijzing</p>
                  </div>
                  <Switch
                    checked={settings.notify_planning_sms}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, notify_planning_sms: checked }))
                    }
                    disabled={!settings.sms_enabled}
                  />
                </div>
              </div>

              <Separator />

              {/* Completion Notifications */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">PROJECT AFGEROND</h4>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Email met werkbon</p>
                    <p className="text-sm text-muted-foreground">Na project afronding</p>
                  </div>
                  <Switch
                    checked={settings.notify_completion_email}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, notify_completion_email: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">SMS naar klant</p>
                    <p className="text-sm text-muted-foreground">Na project afronding</p>
                  </div>
                  <Switch
                    checked={settings.notify_completion_sms}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, notify_completion_sms: checked }))
                    }
                    disabled={!settings.sms_enabled}
                  />
                </div>
              </div>

              <Separator />

              {/* Other Notifications */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">OVERIGE</h4>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Bonnetje goedkeuring</p>
                    <p className="text-sm text-muted-foreground">Email naar monteur</p>
                  </div>
                  <Switch
                    checked={settings.notify_receipt_approval_email}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, notify_receipt_approval_email: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Offerte goedgekeurd</p>
                    <p className="text-sm text-muted-foreground">Email naar klant</p>
                  </div>
                  <Switch
                    checked={settings.notify_quote_approval_email}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, notify_quote_approval_email: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Factuur verzonden</p>
                    <p className="text-sm text-muted-foreground">Email met betaallink</p>
                  </div>
                  <Switch
                    checked={settings.notify_invoice_sent_email}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({ ...prev, notify_invoice_sent_email: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={fetchSettings} disabled={saving}>
          Annuleren
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
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

