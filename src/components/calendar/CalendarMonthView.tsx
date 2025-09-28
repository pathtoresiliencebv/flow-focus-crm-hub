import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (eventId: string, updates: Partial<CalendarEvent>) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  events,
  onDateSelect,
  onEventClick
}) => {
  
  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_datetime), date)
    );
  };

  // Get category color
  const getCategoryColor = (category: CalendarEvent['category']) => {
    const colors = {
      werk: 'bg-blue-500',
      persoonlijk: 'bg-green-500',
      vakantie: 'bg-purple-500',
      meeting: 'bg-orange-500',
      project: 'bg-red-500',
      reminder: 'bg-yellow-500',
      deadline: 'bg-red-600'
    };
    return colors[category] || 'bg-gray-500';
  };

  // Custom day content
  const renderDayContent = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    
    return (
      <div className="w-full h-full p-1">
        <div className="text-sm font-medium mb-1">
          {format(date, 'd')}
        </div>
        
        {dayEvents.length > 0 && (
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-xs p-1 rounded text-white cursor-pointer truncate",
                  getCategoryColor(event.category)
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle event click - could open edit dialog
                }}
                title={`${event.title} - ${format(new Date(event.start_datetime), 'HH:mm')}`}
              >
                {event.is_all_day ? event.title : `${format(new Date(event.start_datetime), 'HH:mm')} ${event.title}`}
              </div>
            ))}
            
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 3} meer
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="outline" className="bg-blue-500 text-white">Werk</Badge>
        <Badge variant="outline" className="bg-green-500 text-white">Persoonlijk</Badge>
        <Badge variant="outline" className="bg-purple-500 text-white">Vakantie</Badge>
        <Badge variant="outline" className="bg-orange-500 text-white">Meeting</Badge>
        <Badge variant="outline" className="bg-red-500 text-white">Project</Badge>
        <Badge variant="outline" className="bg-yellow-500 text-white">Reminder</Badge>
        <Badge variant="outline" className="bg-red-600 text-white">Deadline</Badge>
      </div>

      {/* Custom Calendar */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {/* Week headers */}
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
            <div key={day} className="p-3 bg-muted text-center font-medium border-b">
              {day}
            </div>
          ))}
          
          {/* Calendar days will be rendered here */}
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && onDateSelect(date)}
            locale={nl}
            className="w-full pointer-events-auto"
            components={{
              DayContent: ({ date }) => renderDayContent(date)
            }}
          />
        </div>
      </div>

      {/* Today's Events */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Vandaag ({format(new Date(), 'd MMMM', { locale: nl })})</h3>
        <div className="space-y-2">
          {getEventsForDate(new Date()).map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => {
                // Handle event click - could open edit dialog
              }}
            >
              <div className={cn("w-3 h-3 rounded-full", getCategoryColor(event.category))} />
              <div className="flex-1">
                <div className="font-medium">{event.title}</div>
                {event.description && (
                  <div className="text-sm text-muted-foreground">{event.description}</div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {event.is_all_day 
                  ? 'Hele dag' 
                  : `${format(new Date(event.start_datetime), 'HH:mm')} - ${format(new Date(event.end_datetime), 'HH:mm')}`
                }
              </div>
            </div>
          ))}
          
          {getEventsForDate(new Date()).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Geen events voor vandaag
            </div>
          )}
        </div>
      </div>
    </div>
  );
};