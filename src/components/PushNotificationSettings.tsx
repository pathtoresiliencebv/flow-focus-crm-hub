import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Smartphone, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PushNotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enabled: false,
    chat_notifications: true,
    project_notifications: true,
    planning_notifications: true,
    invoice_notifications: true,
  });

  const handleTestNotification = () => {
    toast({
      title: "Test notificatie",
      description: "Dit is een test notificatie om te controleren of alles werkt.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notificaties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Push notificaties zijn momenteel in ontwikkeling en worden binnenkort beschikbaar.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="push-enabled">Push notificaties inschakelen</Label>
                <p className="text-sm text-muted-foreground">
                  Ontvang meldingen op dit apparaat
                </p>
              </div>
              <Switch
                id="push-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enabled: checked }))
                }
                disabled
              />
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <Label htmlFor="chat-notifications">Chat berichten</Label>
                <Switch
                  id="chat-notifications"
                  checked={settings.chat_notifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, chat_notifications: checked }))
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="project-notifications">Project updates</Label>
                <Switch
                  id="project-notifications"
                  checked={settings.project_notifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, project_notifications: checked }))
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="planning-notifications">Planning wijzigingen</Label>
                <Switch
                  id="planning-notifications"
                  checked={settings.planning_notifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, planning_notifications: checked }))
                  }
                  disabled={!settings.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="invoice-notifications">Factuur updates</Label>
                <Switch
                  id="invoice-notifications"
                  checked={settings.invoice_notifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, invoice_notifications: checked }))
                  }
                  disabled={!settings.enabled}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleTestNotification}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Test Notificatie
            </Button>
          </div>

          <Badge variant="secondary" className="w-fit">
            Feature in ontwikkeling
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};