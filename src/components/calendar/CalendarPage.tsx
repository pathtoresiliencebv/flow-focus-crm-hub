import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, Settings, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { EventCreateDialog } from './EventCreateDialog';
import { CalendarSettingsDialog } from './CalendarSettingsDialog';
import { CalendarSidebar } from './CalendarSidebar';
import { useCalendarFilters } from '@/hooks/useCalendarFilters';
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
  const {
    filters,
    toggleRole,
    toggleUser,
    togglePersonalEvents,
    isRoleActive,
    isUserActive,
  } = useCalendarFilters();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>(settings?.default_view || 'week');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    fetchEventsForPeriod(currentDate, view, filters);
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

  // Refresh events when date, view, or filters change
  React.useEffect(() => {
    if (user) {
      fetchEventsForPeriod(currentDate, currentView, filters);
    }
  }, [currentDate, currentView, user, filters]);

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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <CalendarSidebar
        filters={filters}
        onToggleRole={toggleRole}
        onToggleUser={toggleUser}
        onTogglePersonalEvents={togglePersonalEvents}
        isRoleActive={isRoleActive}
        isUserActive={isUserActive}
        collapsed={sidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-background border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigatePrevious}
                  className="h-9"
                  disabled={loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateNext}
                  className="h-9"
                  disabled={loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigateToday}
                  className="h-9 px-4"
                  disabled={loading}
                >
                  Vandaag
                </Button>
              </div>

              <h1 className="text-xl font-semibold text-foreground">
                {getFormattedDate()}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={currentView === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('month')}
                  disabled={loading}
                  className="h-8"
                >
                  Maand
                </Button>
                <Button
                  variant={currentView === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('week')}
                  disabled={loading}
                  className="h-8"
                >
                  Week
                </Button>
                <Button
                  variant={currentView === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleViewChange('day')}
                  disabled={loading}
                  className="h-8"
                >
                  Dag
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsDialogOpen(true)}
                className="h-9 w-9"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => setCreateDialogOpen(true)}
                disabled={loading}
                className="h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuw Event
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Agenda wordt geladen...</p>
              </div>
            </div>
          ) : (
            <>
              {currentView === 'month' && (
                <CalendarMonthView
                  currentDate={currentDate}
                  events={events}
                  onDateSelect={handleDateSelect}
                  onEventClick={(event) => console.log('Event clicked:', event)}
                />
              )}
              {currentView === 'week' && (
                <CalendarWeekView
                  currentDate={currentDate}
                  events={events}
                  onDateSelect={handleDateSelect}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventClick={(event) => console.log('Event clicked:', event)}
                />
              )}
              {currentView === 'day' && (
                <CalendarDayView
                  currentDate={currentDate}
                  events={events}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventClick={(event) => console.log('Event clicked:', event)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EventCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onEventCreate={createEvent}
        selectedDate={selectedDate}
      />

      <CalendarSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </div>
  );
};