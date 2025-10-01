import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, RefreshCw, Settings, Users, CheckCircle, AlertCircle, List } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { CalendarSelection } from "./CalendarSelection";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const CalendarIntegration: React.FC = () => {
  const { user, profile } = useAuth();
  const { 
    calendarSettings, 
    availableCalendars, 
    isLoading, 
    isConnected,
    startOAuthFlow,
    syncPlanningToGoogle,
    syncFromGoogle,
    toggleSync
  } = useGoogleCalendar();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const authUrl = await startOAuthFlow();
      window.location.href = authUrl;
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
      await syncPlanningToGoogle();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromGoogle = async () => {
    setIsSyncing(true);
    try {
      await syncFromGoogle();
    } catch (error) {
      console.error('Error importing from Google:', error);
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
          {isConnected ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overzicht</TabsTrigger>
                <TabsTrigger value="calendars">Agenda's</TabsTrigger>
                <TabsTrigger value="sync">Synchronisatie</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">Verbonden met Google Calendar</h3>
                    <p className="text-sm text-muted-foreground">
                      Primaire calendar: {calendarSettings?.calendar_name}
                    </p>
                    {calendarSettings?.selected_calendars && calendarSettings.selected_calendars.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {calendarSettings.selected_calendars.length} agenda(s) geselecteerd
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(calendarSettings?.sync_status || 'pending')}>
                    {calendarSettings?.sync_status === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {calendarSettings?.sync_status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {calendarSettings?.sync_status || 'pending'}
                  </Badge>
                </div>

                {calendarSettings?.last_sync_at && (
                  <p className="text-sm text-muted-foreground">
                    Laatste synchronisatie: {new Date(calendarSettings.last_sync_at).toLocaleString('nl-NL')}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleSync} disabled={isSyncing}>
                    {isSyncing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    Naar Google
                  </Button>
                  <Button variant="outline" onClick={handleImportFromGoogle} disabled={isSyncing}>
                    {isSyncing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    Van Google
                  </Button>
                  <Button variant="outline" onClick={handleConnect}>
                    <Settings className="h-4 w-4 mr-2" />
                    Heropnieuw
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="calendars">
                <CalendarSelection />
              </TabsContent>

              <TabsContent value="sync" className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Functies:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Automatische synchronisatie van planning items
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Meerdere agenda's selecteren
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Bidirectionele synchronisatie
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Team overzicht voor administrators
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
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
        </CardContent>
      </Card>
    </div>
  );
};