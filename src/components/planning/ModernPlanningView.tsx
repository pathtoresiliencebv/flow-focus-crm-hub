import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Info, 
  Users, 
  Filter,
  Grid3X3,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { usePlanningStore, PlanningItem } from '@/hooks/usePlanningStore';
import { useRealUserStore } from '@/hooks/useRealUserStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ModernPlanningViewProps {
  onEventClick?: (event: any) => void;
  onDateClick?: (date: Date) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export function ModernPlanningView({ onEventClick, onDateClick }: ModernPlanningViewProps) {
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const [showPlanningPanel, setShowPlanningPanel] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showLegend, setShowLegend] = useState(true);

  const { 
    planningItems, 
    loading, 
    addPlanningItem,
  } = usePlanningStore();

  const { installers } = useRealUserStore();
  const { projects } = useCrmStore();

  // Generate user colors
  const userColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const getUserColor = (userId: string) => {
    const index = installers.findIndex(i => i.id === userId);
    return userColors[index % userColors.length];
  };

  // Convert planning items with installer names and colors
  const eventsWithInstallers = planningItems.map(item => {
    const installer = installers.find(i => i.id === item.assigned_user_id);
    return {
      ...item,
      assigned_user_name: installer?.full_name || installer?.email || 'Onbekend',
      color: getUserColor(item.assigned_user_id)
    };
  });

  // Filter events by selected users
  const filteredEvents = selectedUsers.length > 0 
    ? eventsWithInstallers.filter(event => selectedUsers.includes(event.assigned_user_id))
    : eventsWithInstallers;

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowPlanningPanel(true);
    onDateClick?.(date);
  };

  const handleEventClick = (event: any) => {
    onEventClick?.(event);
    if (event.project_id) {
      window.location.href = `/projects/${event.project_id}`;
    }
  };

  const handlePlanProject = async (data: {
    project_id: string;
    assigned_user_id: string;
    start_date: string;
    start_time: string;
    end_time: string;
    title: string;
    description: string;
  }) => {
    try {
      await addPlanningItem({
        ...data,
        user_id: user?.id || '',
        status: 'Gepland'
      });

      toast({
        title: "✅ Project ingepland!",
        description: `Project is succesvol ingepland voor ${format(new Date(data.start_date), 'dd MMMM yyyy', { locale: nl })}.`,
      });
    } catch (error) {
      console.error('Error planning project:', error);
      toast({
        title: "❌ Fout bij inplannen",
        description: "Er ging iets mis bij het inplannen van het project.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => 
      isSameDay(new Date(event.start_date), date)
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add days from previous/next month to fill the grid
    const startDay = monthStart.getDay();
    const endDay = monthEnd.getDay();
    const prevMonthDays = startDay === 0 ? 6 : startDay - 1;
    const nextMonthDays = 6 - endDay;
    
    const prevMonth = new Date(monthStart);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthEnd = endOfMonth(prevMonth);
    
    const nextMonth = new Date(monthEnd);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStart = startOfMonth(nextMonth);
    
    const allDays = [
      ...Array.from({ length: prevMonthDays }, (_, i) => {
        const date = new Date(prevMonthEnd);
        date.setDate(date.getDate() - prevMonthDays + i + 1);
        return { date, isCurrentMonth: false };
      }),
      ...days.map(date => ({ date, isCurrentMonth: true })),
      ...Array.from({ length: nextMonthDays }, (_, i) => {
        const date = new Date(nextMonthStart);
        date.setDate(date.getDate() + i);
        return { date, isCurrentMonth: false };
      })
    ];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {allDays.map(({ date, isCurrentMonth }, index) => {
          const events = getEventsForDate(date);
          const isToday = isSameDay(date, new Date());
          
          return (
            <div
              key={index}
              className={`min-h-[120px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
              onClick={() => handleDateClick(date)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                {date.getDate()}
              </div>
              
              {/* Events for this day */}
              <div className="space-y-1">
                {events.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className="text-xs p-1 rounded text-white truncate"
                    style={{ backgroundColor: event.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{events.length - 3} meer
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date, index) => {
          const events = getEventsForDate(date);
          const isToday = isSameDay(date, new Date());
          
          return (
            <div
              key={index}
              className={`min-h-[400px] p-2 border border-gray-200 ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
              }`}
            >
              <div className="text-center mb-2">
                <div className={`text-sm font-medium ${
                  isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
                }`}>
                  {format(date, 'EEE', { locale: nl })}
                </div>
                <div className={`text-lg ${
                  isToday ? 'text-blue-600 font-bold' : 'text-gray-700'
                }`}>
                  {date.getDate()}
                </div>
              </div>
              
              <div className="space-y-1">
                {events.map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className="text-xs p-2 rounded text-white cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: event.color }}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-90">
                      {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const events = getEventsForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());
    
    return (
      <div className="min-h-[600px] p-4">
        <div className={`text-center mb-4 p-4 rounded-lg ${
          isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
        }`}>
          <div className="text-2xl font-bold">
            {format(currentDate, 'dd MMMM yyyy', { locale: nl })}
          </div>
          <div className="text-sm text-gray-600">
            {format(currentDate, 'EEEE', { locale: nl })}
          </div>
        </div>
        
        <div className="space-y-2">
          {events.map((event, index) => (
            <div
              key={index}
              className="p-3 rounded-lg text-white cursor-pointer hover:opacity-80"
              style={{ backgroundColor: event.color }}
              onClick={() => handleEventClick(event)}
            >
              <div className="font-medium">{event.title}</div>
              <div className="text-sm opacity-90">
                {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
              </div>
              {event.description && (
                <div className="text-sm opacity-75 mt-1">{event.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Planning wordt geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-red-600">Planning</h1>
            
            {/* Info Button */}
            <Sheet open={showInfoPanel} onOpenChange={setShowInfoPanel}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Planning Informatie</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Hoe werkt de planning?</h3>
                    <ul className="text-sm space-y-2 text-gray-600">
                      <li>• Klik op een datum om een project in te plannen</li>
                      <li>• Gebruik de filters om specifieke monteurs te bekijken</li>
                      <li>• Klik op een planning om details te bekijken</li>
                      <li>• Gebruik de weergave knoppen om tussen dag/week/maand te schakelen</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Legenda</h3>
                    <div className="space-y-2">
                      {installers.slice(0, 5).map((installer, index) => (
                        <div key={installer.id} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getUserColor(installer.id) }}
                          />
                          <span className="text-sm">{installer.full_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Project Planning Button */}
            {hasPermission("planning_create") && (
              <Button 
                onClick={() => setShowPlanningPanel(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Project Inplannen
              </Button>
            )}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <Card className="h-full">
            <CardContent className="h-full p-0">
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Controls */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: nl })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* User Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-1">
                {installers.slice(0, 8).map((installer) => (
                  <Button
                    key={installer.id}
                    variant={selectedUsers.includes(installer.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedUsers(prev => 
                        prev.includes(installer.id) 
                          ? prev.filter(id => id !== installer.id)
                          : [...prev, installer.id]
                      );
                    }}
                    className="text-xs"
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: getUserColor(installer.id) }}
                    />
                    {installer.full_name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="text-xs"
            >
              Dag
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="text-xs"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="text-xs"
            >
              Maand
            </Button>
          </div>
        </div>
      </div>

      {/* Planning Panel */}
      {showPlanningPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Project Inplannen</h3>
              {/* Planning form would go here */}
              <div className="flex gap-2 mt-4">
                <Button onClick={() => setShowPlanningPanel(false)}>
                  Sluiten
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
