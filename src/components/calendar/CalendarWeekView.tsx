import React from 'react';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventClick: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  onTimeSlotClick,
  onEventClick
}) => {
  
  // Generate week days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Time slots (6 AM to 11 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);
  
  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_datetime), date)
    );
  };

  // Get category color
  const getCategoryColor = (category: CalendarEvent['category']) => {
    const colors = {
      werk: 'bg-blue-500 border-blue-600',
      persoonlijk: 'bg-green-500 border-green-600',
      vakantie: 'bg-purple-500 border-purple-600',
      meeting: 'bg-orange-500 border-orange-600',
      project: 'bg-red-500 border-red-600',
      reminder: 'bg-yellow-500 border-yellow-600',
      deadline: 'bg-red-600 border-red-700'
    };
    return colors[category] || 'bg-gray-500 border-gray-600';
  };

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);
    
    if (event.is_all_day) {
      return {
        top: 0,
        height: '24px',
        zIndex: 10
      };
    }

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    // Position relative to 6 AM (first slot)
    const top = (startHour - 6) * 60; // 60px per hour
    const height = (endHour - startHour) * 60;
    
    return {
      top: `${Math.max(0, top)}px`,
      height: `${Math.max(30, height)}px`,
      zIndex: 5
    };
  };

  return (
    <div className="overflow-auto">
      {/* Week header */}
      <div className="grid grid-cols-8 gap-0 border-b sticky top-0 bg-background z-20">
        <div className="p-3 border-r bg-muted">
          <div className="text-sm font-medium">Tijd</div>
        </div>
        {weekDays.map((day) => (
          <div 
            key={day.toISOString()} 
            className="p-3 text-center border-r cursor-pointer hover:bg-accent"
            onClick={() => onDateSelect(day)}
          >
            <div className="text-sm font-medium">
              {format(day, 'EEE', { locale: nl })}
            </div>
            <div className={cn(
              "text-lg font-bold mt-1",
              isSameDay(day, new Date()) && "text-primary"
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events row */}
      <div className="grid grid-cols-8 gap-0 border-b bg-gray-50/50">
        <div className="p-2 border-r bg-muted text-xs text-muted-foreground">
          Hele dag
        </div>
        {weekDays.map((day) => {
          const allDayEvents = getEventsForDate(day).filter(e => e.is_all_day);
          return (
            <div key={`allday-${day.toISOString()}`} className="p-2 border-r min-h-[40px]">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "text-xs p-1 rounded text-white cursor-pointer mb-1 truncate",
                    getCategoryColor(event.category)
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle event click
                  }}
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time slots */}
      <div className="relative">
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 gap-0 h-[60px] border-b">
            <div className="p-2 border-r bg-muted text-sm">
              {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
            </div>
            {weekDays.map((day) => (
              <div
                key={`${day.toISOString()}-${hour}`}
                className="border-r hover:bg-accent cursor-pointer relative"
                onClick={() => onTimeSlotClick(day, hour)}
              >
                {/* Events for this time slot */}
                {getEventsForDate(day)
                  .filter(event => !event.is_all_day)
                  .filter(event => {
                    const eventStart = new Date(event.start_datetime);
                    const eventStartHour = eventStart.getHours();
                    return eventStartHour === hour;
                  })
                  .map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-1 right-1 text-xs p-1 rounded text-white cursor-pointer border-l-4 overflow-hidden",
                        getCategoryColor(event.category)
                      )}
                      style={getEventStyle(event)}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle event click
                      }}
                      title={`${event.title} - ${format(new Date(event.start_datetime), 'HH:mm')} tot ${format(new Date(event.end_datetime), 'HH:mm')}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.location && (
                        <div className="text-xs opacity-90 truncate">{event.location}</div>
                      )}
                    </div>
                  ))
                }
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Current time line */}
      <CurrentTimeLine />
    </div>
  );
};

// Current time indicator
const CurrentTimeLine: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  
  // Only show during business hours (6 AM to 11 PM)
  if (currentHour < 6 || currentHour > 23) {
    return null;
  }

  const top = (currentHour - 6) * 60;

  return (
    <div
      className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 pointer-events-none"
      style={{ top: `${top + 84}px` }} // Offset for headers
    >
      <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
    </div>
  );
};