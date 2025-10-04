import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { 
  format, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addMonths, 
  subMonths, 
  isSameDay, 
  isSameMonth,
  isToday as checkIsToday
} from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface PlanningEvent {
  id: string;
  project_id?: string;
  title: string;
  start_date: string;
  start_time: string;
  assigned_user_id: string;
  assigned_user_name?: string;
}

interface SimplifiedPlanningCalendarProps {
  events: PlanningEvent[];
  onDateClick: (date: Date) => void;
  onEventClick?: (event: PlanningEvent) => void;
}

export const SimplifiedPlanningCalendar: React.FC<SimplifiedPlanningCalendarProps> = ({
  events,
  onDateClick,
  onEventClick
}) => {
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
    return events.filter(event => event.start_date === dateStr);
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

  return (
    <Card className="w-full bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToPreviousMonth} 
            className="h-9 w-9 p-0 hover:bg-white/70 transition-all active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold text-gray-800 min-w-[200px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: nl })}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToNextMonth} 
            className="h-9 w-9 p-0 hover:bg-white/70 transition-all active:scale-95"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Button
          onClick={() => setCurrentMonth(new Date())}
          variant="outline"
          size="sm"
          className="hidden sm:flex hover:bg-white transition-all"
        >
          Vandaag
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {dayNames.map((dayName) => (
          <div 
            key={dayName} 
            className="p-3 text-center text-sm font-semibold text-gray-700 border-r last:border-r-0"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 bg-white">
        {weeks.map((week) =>
          week.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday = checkIsToday(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const visibleEvents = dayEvents.slice(0, 2);
            const remainingCount = dayEvents.length - 2;
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  relative min-h-[100px] sm:min-h-[120px] p-2 border-r border-b last:border-r-0 
                  cursor-pointer transition-all duration-200
                  ${!isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-blue-50/30'}
                  ${isToday ? 'bg-blue-50/40' : ''}
                  group
                `}
                onClick={() => onDateClick(day)}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`
                    text-sm font-semibold flex items-center justify-center
                    ${isToday 
                      ? 'bg-blue-500 text-white rounded-full w-7 h-7 shadow-sm' 
                      : !isCurrentMonth 
                        ? 'text-gray-400' 
                        : 'text-gray-700'
                    }
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Add Button (visible on hover) */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(day);
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-600" />
                  </Button>
                </div>
                
                {/* Events */}
                <div className="space-y-1 overflow-hidden">
                  {visibleEvents.map(event => (
                    <div
                      key={event.id}
                      className="
                        text-xs p-1.5 rounded-md cursor-pointer 
                        bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                        transition-all hover:shadow-md hover:scale-105
                        truncate
                      "
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      title={`${event.start_time} - ${event.title}`}
                    >
                      <div className="font-medium truncate">
                        <span className="opacity-90">{event.start_time.slice(0, 5)}</span> {event.title}
                      </div>
                    </div>
                  ))}
                  
                  {remainingCount > 0 && (
                    <div className="text-xs text-gray-600 font-medium pl-1">
                      +{remainingCount} meer
                    </div>
                  )}
                  
                  {/* Empty state hint */}
                  {dayEvents.length === 0 && isCurrentMonth && (
                    <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity text-center pt-2">
                      Klik om in te plannen
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

