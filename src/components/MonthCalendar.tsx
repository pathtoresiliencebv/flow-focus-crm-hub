
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns";
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

interface MonthCalendarProps {
  events?: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (date: Date, startHour: number, endHour: number) => void;
}

const eventColors = {
  meditation: 'bg-green-400 text-white',
  appointment: 'bg-purple-400 text-white', 
  meeting: 'bg-blue-400 text-white',
  other: 'bg-gray-400 text-white'
};

export const MonthCalendar = ({ 
  events = [], 
  onEventClick, 
  onEventCreate
}: MonthCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateStr).slice(0, 3); // Show max 3 events
  };
  
  const getDaysInMonth = () => {
    const days = [];
    let day = startDate;
    
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  };
  
  const days = getDaysInMonth();
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handleDayClick = (date: Date) => {
    if (onEventCreate) {
      onEventCreate(date, 9, 10); // Default 9-10 AM
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-0">
            {format(currentMonth, 'MMMM yyyy', { locale: nl })}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToNextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {dayNames.map((dayName) => (
          <div key={dayName} className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const remainingEvents = events.filter(event => event.date === format(day, 'yyyy-MM-dd')).length - 3;
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm font-medium ${
                    isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDayClick(day);
                    }}
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded cursor-pointer ${eventColors[event.type]} transition-opacity hover:opacity-80 truncate`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className="font-medium truncate">{event.startTime} {event.title}</div>
                    </div>
                  ))}
                  {remainingEvents > 0 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{remainingEvents} meer
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
