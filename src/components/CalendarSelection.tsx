import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, Shield, Eye } from 'lucide-react';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

export const CalendarSelection: React.FC = () => {
  const { user } = useAuth();
  const { 
    calendarSettings, 
    availableCalendars, 
    selectCalendars, 
    isLoading 
  } = useGoogleCalendar();
  
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

  useEffect(() => {
    if (calendarSettings?.selected_calendars) {
      const selectedIds = calendarSettings.selected_calendars.map((cal: any) => cal.id);
      setSelectedCalendars(selectedIds);
    } else if (calendarSettings?.calendar_id) {
      // Backwards compatibility
      setSelectedCalendars([calendarSettings.calendar_id]);
    }
  }, [calendarSettings]);

  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } else {
        return [...prev, calendarId];
      }
    });
  };

  const handleSaveSelection = async () => {
    if (selectedCalendars.length === 0) {
      return;
    }
    await selectCalendars(selectedCalendars);
  };

  const getAccessRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="h-4 w-4 text-green-600" />;
      case 'writer': return <Users className="h-4 w-4 text-blue-600" />;
      case 'reader': return <Eye className="h-4 w-4 text-gray-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAccessRoleText = (role: string) => {
    switch (role) {
      case 'owner': return 'Eigenaar';
      case 'writer': return 'Editor';
      case 'reader': return 'Lezer';
      default: return role;
    }
  };

  const getRoleDescription = () => {
    if (!user?.user_metadata?.role) return '';
    
    switch (user.user_metadata.role) {
      case 'Installateur':
        return 'Als installateur kun je planning items synchroniseren naar team agenda\'s. Selecteer de agenda\'s waar jouw planning zichtbaar moet zijn.';
      case 'Administrator':
      case 'Administratie':
        return 'Als administrator kun je alle team agenda\'s beheren en planning van het hele team overzien.';
      default:
        return 'Selecteer agenda\'s voor synchronisatie van planning items.';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Agenda\'s laden...</div>
        </CardContent>
      </Card>
    );
  }

  if (!availableCalendars || availableCalendars.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Geen agenda\'s beschikbaar. Verbind eerst je Google Calendar.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agenda Selectie
        </CardTitle>
        <CardDescription>
          {getRoleDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {availableCalendars.map((calendar: GoogleCalendar) => (
            <div
              key={calendar.id}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                id={calendar.id}
                checked={selectedCalendars.includes(calendar.id)}
                onCheckedChange={() => handleCalendarToggle(calendar.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor={calendar.id}
                    className="font-medium cursor-pointer truncate"
                  >
                    {calendar.summary}
                  </label>
                  {calendar.primary && (
                    <Badge variant="secondary" className="text-xs">
                      Primair
                    </Badge>
                  )}
                </div>
                {calendar.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {calendar.description}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {getAccessRoleIcon(calendar.accessRole)}
                  <span className="text-xs text-muted-foreground">
                    {getAccessRoleText(calendar.accessRole)}
                  </span>
                </div>
              </div>
              {calendar.backgroundColor && (
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: calendar.backgroundColor }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedCalendars.length} agenda(s) geselecteerd
          </div>
          <Button 
            onClick={handleSaveSelection}
            disabled={selectedCalendars.length === 0}
          >
            Selectie Opslaan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};