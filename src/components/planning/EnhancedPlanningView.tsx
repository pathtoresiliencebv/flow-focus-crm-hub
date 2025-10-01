import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PlanningEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  installerId: string;
  installerName: string;
  installerAvatar?: string;
  projectId: string;
  projectTitle: string;
  location: string;
  status: 'planned' | 'confirmed' | 'in-progress' | 'completed';
  color: string;
}

interface Installer {
  id: string;
  name: string;
  avatar?: string;
  role: 'Installateur';
  isActive: boolean;
  currentProject?: string;
}

interface EnhancedPlanningViewProps {
  events?: PlanningEvent[];
  installers?: Installer[];
  onEventClick?: (event: PlanningEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number, installerId: string) => void;
  onEventCreate?: (date: Date, startHour: number, endHour: number, installerId: string) => void;
  onInstallerClick?: (installer: Installer) => void;
  showCurrentTimeLine?: boolean;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

const statusColors = {
  'planned': 'bg-blue-100 text-blue-800 border-blue-200',
  'confirmed': 'bg-green-100 text-green-800 border-green-200',
  'in-progress': 'bg-orange-100 text-orange-800 border-orange-200',
  'completed': 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusLabels = {
  'planned': 'Gepland',
  'confirmed': 'Bevestigd',
  'in-progress': 'Bezig',
  'completed': 'Afgerond'
};

export const EnhancedPlanningView: React.FC<EnhancedPlanningViewProps> = ({
  events = [],
  installers = [],
  onEventClick,
  onTimeSlotClick,
  onEventCreate,
  onInstallerClick,
  showCurrentTimeLine = true
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedInstaller, setSelectedInstaller] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const dayNames = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'];

  // Update current time every minute
  useEffect(() => {
    if (!showCurrentTimeLine) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [showCurrentTimeLine]);

  // Navigation functions
  const navigatePrevious = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const navigateNext = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const navigateToday = () => {
    setCurrentWeek(new Date());
  };

  // Get events for specific date and installer
  const getEventsForDateAndInstaller = (date: Date, installerId: string) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date) && event.installerId === installerId
    );
  };

  // Get current time position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timePosition = currentHour + (currentMinute / 60);
    
    if (timePosition < 7 || timePosition > 20) return null;
    
    return ((timePosition - 7) / 13) * 100; // Convert to percentage
  };

  // Format time for display
  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Handle installer selection
  const handleInstallerClick = (installer: Installer) => {
    setSelectedInstaller(selectedInstaller === installer.id ? null : installer.id);
    onInstallerClick?.(installer);
  };

  // Handle time slot click
  const handleTimeSlotClick = (date: Date, hour: number, installerId: string) => {
    onTimeSlotClick?.(date, hour, installerId);
  };

  // Filter installers based on selection
  const filteredInstallers = selectedInstaller 
    ? installers.filter(installer => installer.id === selectedInstaller)
    : installers;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={navigatePrevious}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={navigateNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={navigateToday}
                className="h-8 px-3"
              >
                Vandaag
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {format(weekStart, 'd MMMM', { locale: nl })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: nl })}
            </div>
            <div className="text-sm text-gray-500">
              Week {format(weekStart, 'w', { locale: nl })} van {format(weekStart, 'yyyy', { locale: nl })}
            </div>
          </div>

          <Button
            onClick={() => onEventCreate?.(new Date(), 9, 17, '')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Planning
          </Button>
        </div>
      </div>

      {/* Planning Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Installers Column */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Monteurs</h3>
              <p className="text-sm text-gray-500">Klik op een monteur om te filteren</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredInstallers.map((installer) => (
                <div
                  key={installer.id}
                  onClick={() => handleInstallerClick(installer)}
                  className={cn(
                    "p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50",
                    selectedInstaller === installer.id && "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={installer.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {installer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {installer.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          installer.isActive ? "bg-green-400" : "bg-gray-300"
                        )} />
                        <span>{installer.isActive ? 'Actief' : 'Inactief'}</span>
                      </div>
                      {installer.currentProject && (
                        <div className="text-xs text-blue-600 mt-1">
                          {installer.currentProject}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Planning Grid */}
          <div className="flex-1 overflow-auto">
            <div className="min-w-full">
              {/* Days Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="flex">
                  <div className="w-20"></div> {/* Time column spacer */}
                  {weekDays.map((day, index) => (
                    <div key={index} className="flex-1 p-4 text-center border-l border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {dayNames[index]}
                      </div>
                      <div className={cn(
                        "text-lg font-bold mt-1",
                        isSameDay(day, new Date()) ? "text-red-600" : "text-gray-700"
                      )}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Grid */}
              <div className="relative">
                {/* Current time line */}
                {showCurrentTimeLine && getCurrentTimePosition() && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                    style={{ top: `${getCurrentTimePosition()}%` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}

                {timeSlots.map((hour) => (
                  <div key={hour} className="flex border-b border-gray-100">
                    {/* Time Column */}
                    <div className="w-20 p-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-200">
                      {formatTime(hour)}
                    </div>

                    {/* Day Columns */}
                    {weekDays.map((day, dayIndex) => (
                      <div key={dayIndex} className="flex-1 border-l border-gray-200 relative">
                        {/* Time slots for each installer */}
                        {filteredInstallers.map((installer) => {
                          const installerEvents = getEventsForDateAndInstaller(day, installer.id);
                          const hourEvents = installerEvents.filter(event => {
                            const eventStart = parseInt(event.startTime.split(':')[0]);
                            const eventEnd = parseInt(event.endTime.split(':')[0]);
                            return hour >= eventStart && hour < eventEnd;
                          });

                          return (
                            <div
                              key={`${installer.id}-${dayIndex}-${hour}`}
                              className="h-16 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleTimeSlotClick(day, hour, installer.id)}
                            >
                              {hourEvents.map((event) => (
                                <div
                                  key={event.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEventClick?.(event);
                                  }}
                                  className={cn(
                                    "absolute inset-1 rounded-lg border-l-4 p-2 cursor-pointer transition-all hover:shadow-md",
                                    statusColors[event.status],
                                    event.color
                                  )}
                                >
                                  <div className="text-xs font-medium truncate">
                                    {event.title}
                                  </div>
                                  <div className="text-xs text-gray-600 truncate">
                                    {event.startTime} - {event.endTime}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="text-xs truncate">{event.location}</span>
                                  </div>
                                  <Badge 
                                    variant="secondary" 
                                    className="absolute top-1 right-1 text-xs"
                                  >
                                    {statusLabels[event.status]}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
