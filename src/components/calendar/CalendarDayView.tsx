import React from 'react';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventClick: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  currentDate,
  events,
  onTimeSlotClick,
  onEventClick
}) => {
  
  // Time slots (6 AM to 11 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6);
  
  // Get events for the current date
  const dayEvents = events.filter(event => 
    isSameDay(new Date(event.start_datetime), currentDate)
  );

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
        height: '40px',
        zIndex: 10,
        left: '8px',
        right: '8px'
      };
    }

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    // Position relative to 6 AM (first slot)
    const top = (startHour - 6) * 80; // 80px per hour for day view
    const height = (endHour - startHour) * 80;
    
    return {
      top: `${Math.max(0, top)}px`,
      height: `${Math.max(40, height)}px`,
      zIndex: 5,
      left: '8px',
      right: '8px'
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="p-4 border-b bg-muted">
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'EEEE d MMMM yyyy', { locale: nl })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
        </p>
      </div>

      {/* All-day events */}
      {dayEvents.some(e => e.is_all_day) && (
        <div className="p-4 border-b bg-gray-50/50">
          <h3 className="text-sm font-medium mb-2">Hele dag</h3>
          <div className="space-y-2">
            {dayEvents.filter(e => e.is_all_day).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-2 rounded text-white cursor-pointer border-l-4",
                  getCategoryColor(event.category)
                )}
                onClick={() => {
                  // Handle event click
                }}
              >
                <div className="font-medium">{event.title}</div>
                {event.description && (
                  <div className="text-sm opacity-90">{event.description}</div>
                )}
                {event.location && (
                  <div className="text-sm opacity-75">📍 {event.location}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time slots */}
      <div className="flex-1 overflow-auto relative">
        {timeSlots.map((hour) => (
          <div key={hour} className="h-[80px] border-b relative">
            <div className="absolute left-0 top-0 w-16 p-2 text-sm text-muted-foreground">
              {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
            </div>
            <div
              className="ml-16 h-full hover:bg-accent cursor-pointer relative"
              onClick={() => onTimeSlotClick(currentDate, hour)}
            >
              {/* 30-minute line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
              
              {/* Events for this time slot */}
              {dayEvents
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
                      "absolute text-sm p-2 rounded text-white cursor-pointer border-l-4 overflow-hidden shadow-sm",
                      getCategoryColor(event.category)
                    )}
                    style={getEventStyle(event)}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle event click
                    }}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs opacity-90">
                      {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
                    </div>
                    {event.location && (
                      <div className="text-xs opacity-75 mt-1">📍 {event.location}</div>
                    )}
                    {event.description && (
                      <div className="text-xs opacity-90 mt-1 line-clamp-2">{event.description}</div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        ))}
      </div>

      {/* Current time line */}
      <CurrentTimeLine currentDate={currentDate} />
    </div>
  );
};

// Current time indicator
const CurrentTimeLine: React.FC<{ currentDate: Date }> = ({ currentDate }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Only show if viewing today
  if (!isSameDay(currentDate, currentTime)) {
    return null;
  }

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  
  // Only show during business hours (6 AM to 11 PM)
  if (currentHour < 6 || currentHour > 23) {
    return null;
  }

  const top = (currentHour - 6) * 80; // 80px per hour for day view

  return (
    <div
      className="absolute left-16 right-0 h-0.5 bg-red-500 z-30 pointer-events-none"
      style={{ top: `${top + 120}px` }} // Offset for headers
    >
      <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
      <div className="absolute -left-12 -top-3 bg-red-500 text-white text-xs px-1 rounded">
        {format(currentTime, 'HH:mm')}
      </div>
    </div>
  );
};