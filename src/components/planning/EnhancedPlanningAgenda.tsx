import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, User, MapPin, Clock } from "lucide-react";
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  addDays, 
  isSameDay,
  isToday
} from "date-fns";
import { nl } from "date-fns/locale";

interface Installer {
  id: string;
  full_name: string;
  email: string;
  color?: string;
}

interface PlanningEvent {
  id: string;
  project_id?: string;
  title: string;
  start_date: string;
  start_time: string;
  end_time: string;
  assigned_user_id: string;
  assigned_user_name?: string;
  description?: string;
}

interface EnhancedPlanningAgendaProps {
  events: PlanningEvent[];
  installers: Installer[];
  onEventClick?: (event: PlanningEvent) => void;
  onTimeSlotClick?: (date: Date, installerId: string) => void;
}

// Predefined colors for installers
const INSTALLER_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', hover: 'hover:bg-blue-200' },
  { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', hover: 'hover:bg-green-200' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', hover: 'hover:bg-purple-200' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', hover: 'hover:bg-orange-200' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800', hover: 'hover:bg-pink-200' },
  { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', hover: 'hover:bg-yellow-200' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800', hover: 'hover:bg-indigo-200' },
  { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', hover: 'hover:bg-red-200' },
];

export const EnhancedPlanningAgenda: React.FC<EnhancedPlanningAgendaProps> = ({
  events,
  installers,
  onEventClick,
  onTimeSlotClick
}) => {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayNames = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

  // Assign colors to installers
  const installersWithColors = useMemo(() => {
    return installers.map((installer, index) => ({
      ...installer,
      colors: INSTALLER_COLORS[index % INSTALLER_COLORS.length]
    }));
  }, [installers]);

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const getEventsForDayAndInstaller = (date: Date, installerId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => 
      event.start_date === dateStr && event.assigned_user_id === installerId
    );
  };

  const handleEventClick = (event: PlanningEvent) => {
    if (event.project_id) {
      navigate(`/projects/${event.project_id}`);
    } else if (onEventClick) {
      onEventClick(event);
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousWeek}
                className="h-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[250px]">
                <h3 className="text-lg font-bold">
                  Week {format(weekStart, 'w', { locale: nl })} - {format(currentWeek, 'yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(weekStart, 'd MMM', { locale: nl })} - {format(addDays(weekStart, 6), 'd MMM', { locale: nl })}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextWeek}
                className="h-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={goToToday} variant="default" size="sm">
              Vandaag
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Legend - Monteurs met kleuren */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Monteurs Legenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {installersWithColors.map(installer => (
              <div 
                key={installer.id} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${installer.colors.bg} ${installer.colors.border} border`}
              >
                <div className={`w-3 h-3 rounded-full ${installer.colors.bg} ${installer.colors.border} border-2`} />
                <span className={`text-sm font-medium ${installer.colors.text}`}>
                  {installer.full_name || installer.email}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Week Planning Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header Row - Days */}
              <div className="grid grid-cols-7 bg-gray-50 border-b">
                {weekDays.map((day, index) => (
                  <div 
                    key={day.toISOString()} 
                    className={`p-3 text-center border-r last:border-r-0 ${
                      isToday(day) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`font-semibold ${isToday(day) ? 'text-blue-600' : 'text-gray-700'}`}>
                      {dayNames[index]}
                    </div>
                    <div className={`text-sm mt-1 ${isToday(day) ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                      {format(day, 'd MMM', { locale: nl })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Monteur Rows */}
              {installersWithColors.map((installer) => (
                <div 
                  key={installer.id} 
                  className="grid grid-cols-7 border-b hover:bg-accent/30 transition-colors"
                >
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDayAndInstaller(day, installer.id);
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div 
                        key={`${installer.id}-${day.toISOString()}`}
                        className={`min-h-[120px] p-2 border-r last:border-r-0 ${
                          hasEvents ? '' : 'cursor-pointer hover:bg-accent/50'
                        }`}
                        onClick={() => !hasEvents && onTimeSlotClick?.(day, installer.id)}
                      >
                        {/* Installer Name Label (first column) */}
                        {isSameDay(day, weekDays[0]) && (
                          <div className={`mb-2 px-2 py-1 rounded-md ${installer.colors.bg} ${installer.colors.border} border`}>
                            <div className="flex items-center gap-2">
                              <User className={`h-3 w-3 ${installer.colors.text}`} />
                              <span className={`text-xs font-medium ${installer.colors.text} truncate`}>
                                {installer.full_name || installer.email}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Events for this day */}
                        <div className="space-y-1.5">
                          {dayEvents.map(event => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                              className={`
                                p-2 rounded-md cursor-pointer transition-all
                                ${installer.colors.bg} ${installer.colors.border} ${installer.colors.hover}
                                border-l-4 shadow-sm hover:shadow-md
                                group
                              `}
                            >
                              <div className={`text-xs font-semibold ${installer.colors.text} truncate mb-1`}>
                                {event.title}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span>{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</span>
                              </div>
                              {event.description && (
                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {event.description}
                                </div>
                              )}
                              <div className={`
                                text-xs ${installer.colors.text} font-medium mt-1 
                                opacity-0 group-hover:opacity-100 transition-opacity
                              `}>
                                Klik om project te openen →
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Empty state hint */}
                        {!hasEvents && (
                          <div className="flex items-center justify-center h-full text-xs text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
                            Klik om in te plannen
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Empty state - no installers */}
              {installers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Geen monteurs beschikbaar</p>
                  <p className="text-sm mt-1">Voeg eerst monteurs toe om te kunnen plannen</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Planning Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Elke monteur heeft een eigen kleur voor overzicht</li>
                <li>• Klik op een ingepland project om naar het project te navigeren</li>
                <li>• Klik op een lege dag om een nieuw project in te plannen</li>
                <li>• Gebruik de week navigatie om vooruit/terug te plannen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

