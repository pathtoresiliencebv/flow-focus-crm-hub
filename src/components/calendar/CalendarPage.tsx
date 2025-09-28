import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { EventCreateDialog } from './EventCreateDialog';
import { CalendarSettingsDialog } from './CalendarSettingsDialog';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useAuth } from '@/contexts/AuthContext';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { nl } from 'date-fns/locale';

type CalendarView = 'month' | 'week' | 'day';

export const CalendarPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { events, loading, fetchEventsForPeriod, createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { settings } = useCalendarSettings();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>(settings?.default_view || 'week');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isAdmin = hasPermission('users_view');

  // Navigation functions
  const navigatePrevious = () => {
    switch (currentView) {
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => subWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate(prev => subDays(prev, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (currentView) {
      case 'month':
        setCurrentDate(prev => addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Handle view change
  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
    fetchEventsForPeriod(currentDate, view);
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  };

  // Handle time slot click
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hour, 0, 0, 0);
    setSelectedDate(selectedDateTime);
    setCreateDialogOpen(true);
  };

  // Get formatted date string for header
  const getFormattedDate = () => {
    switch (currentView) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: nl });
      case 'week':
        return format(currentDate, "'Week van' d MMMM yyyy", { locale: nl });
      case 'day':
        return format(currentDate, 'EEEE d MMMM yyyy', { locale: nl });
    }
  };

  // Refresh events when date or view changes
  React.useEffect(() => {
    fetchEventsForPeriod(currentDate, currentView);
  }, [currentDate, currentView]);

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Je moet ingelogd zijn om de agenda te bekijken.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Beheer alle agenda\'s' : 'Beheer je persoonlijke agenda'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuw Item
          </Button>
          <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation and View Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToday}>
                Vandaag
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold ml-4 capitalize">
                {getFormattedDate()}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Select value={currentView} onValueChange={(value: CalendarView) => handleViewChange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Maand</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Dag</SelectItem>
                </SelectContent>
              </Select>
              
              {isAdmin && (
                <Badge variant="secondary" className="ml-2">
                  Admin Weergave
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Agenda wordt geladen...</p>
              </div>
            </div>
          ) : (
            <>
              {currentView === 'month' && (
                <CalendarMonthView
                  currentDate={currentDate}
                  events={events}
                  onDateSelect={handleDateSelect}
                  onEventClick={updateEvent}
                />
              )}
              
              {currentView === 'week' && (
                <CalendarWeekView
                  currentDate={currentDate}
                  events={events}
                  onDateSelect={handleDateSelect}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventClick={updateEvent}
                />
              )}
              
              {currentView === 'day' && (
                <CalendarDayView
                  currentDate={currentDate}
                  events={events}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventClick={updateEvent}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Event Create Dialog */}
      <EventCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        selectedDate={selectedDate}
        onEventCreate={createEvent}
      />

      {/* Calendar Settings Dialog */}
      <CalendarSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </div>
  );
};