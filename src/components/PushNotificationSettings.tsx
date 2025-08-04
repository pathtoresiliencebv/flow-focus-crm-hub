import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Smartphone, TestTube, Clock } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NotificationSettings {
  enabled: boolean;
  chat_notifications: boolean;
  project_notifications: boolean;
  planning_notifications: boolean;
  invoice_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const PushNotificationSettings: React.FC = () => {
  const {
    isSupported,
    permissionStatus,
    registrationToken,
    requestPermission,
    sendTestNotification,
    disablePushNotifications,
  } = usePushNotifications();

  const { user } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    chat_notifications: true,
    project_notifications: true,
    planning_notifications: true,
    invoice_notifications: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          enabled: data.enabled,
          chat_notifications: data.chat_notifications,
          project_notifications: data.project_notifications,
          planning_notifications: data.planning_notifications,
          invoice_notifications: data.invoice_notifications,
          quiet_hours_enabled: data.quiet_hours_enabled,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end,
        });
      }
    } catch (error: any) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Fout bij laden instellingen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    setSaving(true);
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user?.id,
          ...updatedSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSettings(updatedSettings);
      
      toast({
        title: "Instellingen opgeslagen",
        description: "Je notificatie-instellingen zijn bijgewerkt.",
      });
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      await saveNotificationSettings({ enabled: true });
    }
  };

  const handleDisableNotifications = async () => {
    await disablePushNotifications();
    await saveNotificationSettings({ enabled: false });
  };

  const getPermissionStatusBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">Toegestaan</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">Geweigerd</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-800">Nog niet gevraagd</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Push notificaties zijn alleen beschikbaar in de mobiele app.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Instellingen laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notificaties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Status</h4>
              <p className="text-sm text-muted-foreground">
                {permissionStatus === 'granted' && registrationToken
                  ? "Push notificaties zijn ingeschakeld voor dit apparaat"
                  : "Push notificaties zijn niet ingeschakeld"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionStatusBadge()}
            </div>
          </div>

          <div className="flex gap-2">
            {permissionStatus === 'granted' && registrationToken ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={sendTestNotification}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  Test verzenden
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDisableNotifications}
                  className="flex items-center gap-2"
                >
                  <BellOff className="h-4 w-4" />
                  Uitschakelen
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleEnableNotifications}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Inschakelen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {permissionStatus === 'granted' && registrationToken && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Notificatie Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Alle notificaties</h4>
                  <p className="text-sm text-muted-foreground">
                    Schakel alle push notificaties in of uit
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => saveNotificationSettings({ enabled })}
                  disabled={saving}
                />
              </div>

              {settings.enabled && (
                <>
                  <hr />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Chat berichten</h4>
                      <p className="text-sm text-muted-foreground">
                        Nieuwe berichten in chat kanalen
                      </p>
                    </div>
                    <Switch
                      checked={settings.chat_notifications}
                      onCheckedChange={(chat_notifications) => 
                        saveNotificationSettings({ chat_notifications })
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Project updates</h4>
                      <p className="text-sm text-muted-foreground">
                        Wijzigingen in toegewezen projecten
                      </p>
                    </div>
                    <Switch
                      checked={settings.project_notifications}
                      onCheckedChange={(project_notifications) => 
                        saveNotificationSettings({ project_notifications })
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Planning wijzigingen</h4>
                      <p className="text-sm text-muted-foreground">
                        Nieuwe planning items en wijzigingen
                      </p>
                    </div>
                    <Switch
                      checked={settings.planning_notifications}
                      onCheckedChange={(planning_notifications) => 
                        saveNotificationSettings({ planning_notifications })
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Factuur updates</h4>
                      <p className="text-sm text-muted-foreground">
                        Betalingen en factuur wijzigingen
                      </p>
                    </div>
                    <Switch
                      checked={settings.invoice_notifications}
                      onCheckedChange={(invoice_notifications) => 
                        saveNotificationSettings({ invoice_notifications })
                      }
                      disabled={saving}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Stille uren
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Stille uren inschakelen</h4>
                  <p className="text-sm text-muted-foreground">
                    Geen notificaties tijdens bepaalde uren
                  </p>
                </div>
                <Switch
                  checked={settings.quiet_hours_enabled}
                  onCheckedChange={(quiet_hours_enabled) => 
                    saveNotificationSettings({ quiet_hours_enabled })
                  }
                  disabled={saving}
                />
              </div>

              {settings.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Start tijd</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => 
                        saveNotificationSettings({ quiet_hours_start: e.target.value })
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">Eind tijd</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => 
                        saveNotificationSettings({ quiet_hours_end: e.target.value })
                      }
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {settings.quiet_hours_enabled && (
                <Alert>
                  <AlertDescription>
                    Tijdens stille uren ({settings.quiet_hours_start} - {settings.quiet_hours_end}) 
                    ontvang je geen push notificaties. Dringende meldingen kunnen nog steeds worden weergegeven.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};