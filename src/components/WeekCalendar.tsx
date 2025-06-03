
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
}

const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

const eventColors = {
  meditation: 'bg-green-400 text-white',
  appointment: 'bg-purple-400 text-white', 
  meeting: 'bg-blue-400 text-white',
  other: 'bg-gray-400 text-white'
};

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Mediteren',
    startTime: '08:00',
    endTime: '09:00',
    date: '2025-06-01',
    type: 'meditation',
    description: 'Ochtend meditatie'
  },
  {
    id: '2',
    title: 'Mediteren',
    startTime: '08:00',
    endTime: '09:00',
    date: '2025-06-02',
    type: 'meditation'
  },
  {
    id: '3',
    title: 'Kozijnen specialist crm meeting',
    startTime: '13:00',
    endTime: '18:15',
    date: '2025-06-04',
    type: 'meeting'
  },
  {
    id: '4',
    title: 'Sven komt langs',
    startTime: '10:00',
    endTime: '11:00',
    date: '2025-06-06',
    type: 'appointment'
  },
  {
    id: '5',
    title: 'Met Kevie naar Breda',
    startTime: '12:00',
    endTime: '23:00',
    date: '2025-06-07',
    type: 'appointment'
  }
];

export const WeekCalendar = ({ events = mockEvents, onEventClick, onTimeSlotClick, onEventCreate }: WeekCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dragStart, setDragStart] = useState<{date: Date, hour: number} | null>(null);
  const [dragEnd, setDragEnd] = useState<{date: Date, hour: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const dayNames = ['ZON', 'MAA', 'DIN', 'WOE', 'DON', 'VRI', 'ZAT'];
  
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
    
    const top = (startMinutes / 60) * 60; // 60px per hour
    const height = ((endMinutes - startMinutes) / 60) * 60;
    
    return { top, height };
  };

  const handleMouseDown = (date: Date, hour: number) => {
    setDragStart({date, hour});
    setIsDragging(true);
  };

  const handleMouseEnter = (date: Date, hour: number) => {
    if (isDragging && dragStart) {
      setDragEnd({date, hour});
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && isSameDay(dragStart.date, dragEnd.date)) {
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;
      
      if (onEventCreate) {
        onEventCreate(dragStart.date, startHour, endHour);
      }
    } else if (isDragging && dragStart && !dragEnd) {
      // Single click
      if (onTimeSlotClick) {
        onTimeSlotClick(dragStart.date, dragStart.hour);
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

  return (
    <div className="w-full bg-white rounded-lg border" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'dd MMMM', { locale: nl })} - {format(addDays(weekStart, 6), 'dd MMMM yyyy', { locale: nl })}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          GMT+02
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex">
        {/* Time Column */}
        <div className="w-16 bg-gray-50 border-r">
          <div className="h-12 border-b"></div> {/* Header spacer */}
          {timeSlots.map(hour => (
            <div key={hour} className="h-15 border-b text-xs text-gray-600 p-1 text-right">
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        <div className="flex-1 flex">
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={day.toISOString()} className="flex-1 border-r last:border-r-0">
                {/* Day Header */}
                <div className={`h-12 border-b text-center p-2 ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="text-xs text-gray-600 font-medium">
                    {dayNames[dayIndex]}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="relative">
                  {timeSlots.map(hour => (
                    <div
                      key={hour}
                      className={`h-15 border-b border-gray-100 hover:bg-blue-50 cursor-pointer relative select-none ${
                        isInDragSelection(day, hour) ? 'bg-blue-200' : ''
                      }`}
                      onMouseDown={() => handleMouseDown(day, hour)}
                      onMouseEnter={() => handleMouseEnter(day, hour)}
                    >
                    </div>
                  ))}

                  {/* Events */}
                  {dayEvents.map(event => {
                    const { top, height } = getEventPosition(event);
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 rounded px-2 py-1 text-xs cursor-pointer overflow-hidden ${eventColors[event.type]} z-10`}
                        style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-xs opacity-90">
                          {event.startTime} - {event.endTime}
                        </div>
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
