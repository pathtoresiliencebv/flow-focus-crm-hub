import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CalendarSettings: React.FC = () => {
  const { 
    isConnected, 
    isConnecting, 
    connectGoogleCalendar, 
    disconnectGoogleCalendar,
    checkConnectionStatus
  } = useGoogleCalendar();
  
  const { toast } = useToast();
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'exchange_code', code }
      });

      if (error) throw error;

      toast({
        title: "Google Calendar verbonden!",
        description: `Account ${data.userInfo.email} is succesvol verbonden.`,
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Refresh connection status
      await checkConnectionStatus();
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Fout bij verbinden",
        description: error.message || "Er is een fout opgetreden bij het verbinden van je Google Calendar.",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    try {
      await connectGoogleCalendar();
    } catch (error: any) {
      toast({
        title: "Fout bij verbinden",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Weet je zeker dat je Google Calendar wilt loskoppelen? Bestaande gesynchoniseerde evenementen blijven behouden.")) {
      await disconnectGoogleCalendar();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integratie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Verbindingsstatus</h4>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? "Je Google Calendar is verbonden en planning items worden automatisch gesynchroniseerd."
                  : "Verbind je Google Calendar om planning items automatisch te synchroniseren."
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verbonden
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Niet verbonden
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {isConnected ? (
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                className="flex items-center gap-2"
              >
                Loskoppelen
              </Button>
            ) : (
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2"
              >
                {isConnecting ? "Verbinden..." : "Verbind Google Calendar"}
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isConnected && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Google Calendar is succesvol verbonden. Nieuwe planning items worden automatisch toegevoegd aan je kalender.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synchronisatie-instellingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Automatische synchronisatie</h4>
              <p className="text-sm text-muted-foreground">
                Planning items automatisch synchroniseren met Google Calendar
              </p>
            </div>
            <Switch
              checked={autoSyncEnabled && isConnected}
              onCheckedChange={setAutoSyncEnabled}
              disabled={!isConnected}
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Wat wordt gesynchroniseerd:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Planning items met toegewezen monteurs</li>
              <li>• Start- en eindtijd van werkzaamheden</li>
              <li>• Projectlocatie en beschrijving</li>
              <li>• Wijzigingen in planning items</li>
            </ul>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Let op:</strong> Wijzigingen in Google Calendar worden niet terug gesynchroniseerd naar het CRM systeem. 
              Maak wijzigingen altijd in het CRM systeem om conflicten te voorkomen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Toestemmingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Deze app vraagt toegang tot:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Je Google Calendar evenementen bekijken en beheren</li>
              <li>• Nieuwe evenementen aanmaken in je primaire kalender</li>
              <li>• Bestaande evenementen bijwerken die door deze app zijn aangemaakt</li>
            </ul>
          </div>

          <Alert>
            <AlertDescription>
              Je kunt de verbinding op elk moment loskoppelen. Evenementen die al in je Google Calendar staan blijven behouden.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};