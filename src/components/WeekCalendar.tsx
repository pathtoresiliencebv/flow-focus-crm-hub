
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'meditation' | 'appointment' | 'meeting' | 'other';
  description?: string;
}

interface WeekCalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  onEventCreate?: (date: Date, startHour: number, endHour: number) => void;
  onAddPlanning?: (date: Date) => void;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

const eventColors = {
  meditation: 'bg-green-400 text-white',
  appointment: 'bg-purple-400 text-white', 
  meeting: 'bg-blue-400 text-white',
  other: 'bg-gray-400 text-white'
};

// Dutch time formatting function
const formatDutchTime = (hour: number) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

export const WeekCalendar = ({ 
  events = [], 
  onEventClick, 
  onTimeSlotClick, 
  onEventCreate,
  onAddPlanning 
}: WeekCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dragStart, setDragStart] = useState<{date: Date, hour: number} | null>(null);
  const [dragEnd, setDragEnd] = useState<{date: Date, hour: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const dayNames = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'];
  
  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };
  
  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };
  
  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateStr);
  };
  
  const getEventPosition = (event: CalendarEvent) => {
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    
    const startMinutes = (startHour - 8) * 60 + startMinute;
    const endMinutes = (endHour - 8) * 60 + endMinute;
    
    // Different heights for mobile vs desktop
    const hourHeight = window.innerWidth < 640 ? 40 : 60; // 40px on mobile, 60px on desktop
    const top = (startMinutes / 60) * hourHeight;
    const height = Math.max(((endMinutes - startMinutes) / 60) * hourHeight, 20);
    
    return { top, height };
  };

  const handleMouseDown = (e: React.MouseEvent, date: Date, hour: number) => {
    e.preventDefault();
    console.log('Mouse down on:', date, hour);
    setDragStart({date, hour});
    setDragEnd({date, hour});
    setIsDragging(true);
  };

  const handleMouseEnter = (date: Date, hour: number) => {
    if (isDragging && dragStart && isSameDay(date, dragStart.date)) {
      console.log('Mouse enter on:', date, hour);
      setDragEnd({date, hour});
    }
  };

  const handleMouseUp = () => {
    console.log('Mouse up - isDragging:', isDragging, 'dragStart:', dragStart, 'dragEnd:', dragEnd);
    
    if (isDragging && dragStart) {
      if (dragEnd && !isSameDay(dragStart.date, dragEnd.date)) {
        // Drag across different days - not allowed
        console.log('Drag across different days not allowed');
      } else if (dragEnd && dragStart.hour !== dragEnd.hour) {
        // Multi-hour selection
        const startHour = Math.min(dragStart.hour, dragEnd.hour);
        const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;
        console.log('Creating event from', startHour, 'to', endHour);
        
        if (onEventCreate) {
          onEventCreate(dragStart.date, startHour, endHour);
        }
      } else {
        // Single click
        console.log('Single click on:', dragStart.date, dragStart.hour);
        if (onTimeSlotClick) {
          onTimeSlotClick(dragStart.date, dragStart.hour);
        }
      }
    }
    
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
  };

  const isInDragSelection = (date: Date, hour: number) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    if (!isSameDay(date, dragStart.date)) return false;
    
    const minHour = Math.min(dragStart.hour, dragEnd.hour);
    const maxHour = Math.max(dragStart.hour, dragEnd.hour);
    
    return hour >= minHour && hour <= maxHour;
  };

  const handleAddPlanning = (date: Date) => {
    if (onAddPlanning) {
      onAddPlanning(date);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm sm:text-lg font-semibold min-w-0">
            <span className="hidden sm:inline">
              {format(weekStart, 'dd MMMM', { locale: nl })} - {format(addDays(weekStart, 6), 'dd MMMM yyyy', { locale: nl })}
            </span>
            <span className="sm:hidden text-xs">
              {format(weekStart, 'dd MMM', { locale: nl })} - {format(addDays(weekStart, 6), 'dd MMM yy', { locale: nl })}
            </span>
          </h2>
          <Button variant="ghost" size="sm" onClick={goToNextWeek} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 hidden sm:block">
          GMT+02
        </div>
      </div>

      {/* Mobile View */}
      <div className="block sm:hidden">
        <div className="divide-y divide-gray-100">
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={day.toISOString()} className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-600 font-medium min-w-[20px]">
                      {dayNames[dayIndex]}
                    </div>
                    <div className={`text-lg font-bold flex items-center justify-center ${
                      isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8' : 'w-8 h-8'
                    }`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAddPlanning(day)}
                    className="text-xs h-7 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span className="hidden xs:inline">Planning</span>
                  </Button>
                </div>
                
                {dayEvents.length === 0 ? (
                  <div className="text-xs text-gray-400 py-2 pl-2">
                    Geen afspraken
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-2 rounded cursor-pointer ${eventColors[event.type]} transition-opacity hover:opacity-80`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="opacity-90 text-xs mt-1">
                          {event.startTime} - {event.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop View */}
      <div 
        className="hidden sm:flex overflow-x-auto" 
        onMouseUp={handleMouseUp} 
        onMouseLeave={handleMouseUp}
      >
        {/* Time Column */}
        <div className="w-16 bg-gray-50 border-r flex-shrink-0">
          <div className="h-12 border-b"></div> {/* Header spacer */}
          {timeSlots.map(hour => (
            <div key={hour} className="h-15 border-b text-xs text-gray-600 p-1 text-right flex items-center justify-end">
              {formatDutchTime(hour)}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        <div className="flex-1 flex min-w-0">
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={day.toISOString()} className="flex-1 border-r last:border-r-0 min-w-[120px]">
                {/* Day Header */}
                <div className={`h-12 border-b text-center p-2 relative ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="text-xs text-gray-600 font-medium">
                    {dayNames[dayIndex]}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAddPlanning(day)}
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Time Slots */}
                <div className="relative">
                  {timeSlots.map(hour => (
                    <div
                      key={hour}
                      className={`h-15 border-b border-gray-100 hover:bg-blue-50 cursor-pointer relative transition-colors ${
                        isInDragSelection(day, hour) ? 'bg-blue-200' : ''
                      }`}
                      onMouseDown={(e) => handleMouseDown(e, day, hour)}
                      onMouseEnter={() => handleMouseEnter(day, hour)}
                      style={{ userSelect: 'none' }}
                    >
                      {/* Visual indicator for hour */}
                      <div className="absolute left-1 top-1 text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
                        {formatDutchTime(hour)}
                      </div>
                    </div>
                  ))}

                  {/* Events */}
                  {dayEvents.map(event => {
                    const { top, height } = getEventPosition(event);
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 rounded px-2 py-1 text-xs cursor-pointer overflow-hidden ${eventColors[event.type]} z-10 shadow-sm transition-opacity hover:opacity-90`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Event clicked:', event);
                          onEventClick?.(event);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {height > 30 && (
                          <div className="text-xs opacity-90 truncate">
                            {event.startTime} - {event.endTime}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
