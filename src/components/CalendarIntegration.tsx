import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, RefreshCw, Settings, Users, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CalendarSettings {
  id: string;
  calendar_id: string;
  calendar_name: string;
  sync_enabled: boolean;
  sync_status: string;
  last_sync_at: string | null;
}

export const CalendarIntegration: React.FC = () => {
  const { user, profile } = useAuth();
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCalendarSettings();
    }
  }, [user]);

  const fetchCalendarSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('google_calendar_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setCalendarSettings(data);
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/settings/calendar`;
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'oauth_start',
          redirectUri
        }
      });

      if (error) throw error;
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error starting OAuth:', error);
      toast.error('Fout bij verbinden met Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'sync_planning'
        }
      });

      if (error) throw error;
      
      toast.success(`${data.syncedItems} planning items gesynchroniseerd`);
      fetchCalendarSettings();
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Fout bij synchroniseren');
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'error': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'Installateur':
        return 'Als installateur worden jouw planning items automatisch gesynchroniseerd naar de "Monteurs Agenda" in Google Calendar.';
      case 'Administrator':
      case 'Administratie':
        return 'Als administrator/administratie heb je toegang tot alle team agenda\'s en kan je de synchronisatie beheren.';
      default:
        return 'Jouw planning items kunnen worden gesynchroniseerd naar Google Calendar.';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integratie
          </CardTitle>
          <CardDescription>
            Synchroniseer je planning automatisch met Google Calendar voor je team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role Information */}
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <strong>Jouw rol: {profile?.role}</strong><br />
              {getRoleDescription(profile?.role || '')}
            </AlertDescription>
          </Alert>

          {/* Connection Status */}
          {calendarSettings ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Verbonden met Google Calendar</h3>
                  <p className="text-sm text-muted-foreground">
                    Calendar: {calendarSettings.calendar_name}
                  </p>
                </div>
                <Badge className={getStatusColor(calendarSettings.sync_status)}>
                  {calendarSettings.sync_status === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {calendarSettings.sync_status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {calendarSettings.sync_status}
                </Badge>
              </div>

              {calendarSettings.last_sync_at && (
                <p className="text-sm text-muted-foreground">
                  Laatste synchronisatie: {new Date(calendarSettings.last_sync_at).toLocaleString('nl-NL')}
                </p>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSync} disabled={isSyncing}>
                  {isSyncing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Nu synchroniseren
                </Button>
                <Button variant="outline" onClick={handleConnect}>
                  <Settings className="h-4 w-4 mr-2" />
                  Heropnieuw verbinding
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Nog niet verbonden</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verbind je Google Calendar om automatische synchronisatie in te schakelen.
                </p>
                <Button onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Verbind Google Calendar
                </Button>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Functies:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Automatische synchronisatie van planning items
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Rol-gebaseerde agenda toegang
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Real-time updates tussen platforms
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Team overzicht voor administrators
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};