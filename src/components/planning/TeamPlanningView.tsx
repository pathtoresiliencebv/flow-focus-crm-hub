import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Installer {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

interface PlanningEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  installerId: string;
  location?: string;
  color: string;
}

interface TeamPlanningViewProps {
  installers: Installer[];
  events: PlanningEvent[];
  onEventClick?: (event: PlanningEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number, installerId: string) => void;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export const TeamPlanningView: React.FC<TeamPlanningViewProps> = ({
  installers,
  events,
  onEventClick,
  onTimeSlotClick
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedInstaller, setSelectedInstaller] = useState<string | null>(null);
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const dayNames = ['maa', 'din', 'woe', 'don', 'vri', 'zat', 'zon'];

  const navigatePrevious = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const navigateNext = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const navigateToday = () => {
    setCurrentWeek(new Date());
  };

  const getEventsForDateAndInstaller = (date: Date, installerId: string) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date) && event.installerId === installerId
    );
  };

  const filteredInstallers = selectedInstaller 
    ? installers.filter(installer => installer.id === selectedInstaller)
    : installers;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigatePrevious}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'd MMMM', { locale: nl })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: nl })}
          </h2>
          
          <Button
            variant="ghost"
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
          >
            Vandaag
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Left Sidebar - Team Agenda's */}
          <div className="w-64 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Team Agenda's
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredInstallers.map((installer) => (
                <div
                  key={installer.id}
                  onClick={() => setSelectedInstaller(selectedInstaller === installer.id ? null : installer.id)}
                  className={cn(
                    "p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-100",
                    selectedInstaller === installer.id && "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm")}
                      style={{ backgroundColor: installer.color }}
                    >
                      {installer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="font-medium text-gray-900">{installer.name}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Ongeplande Projecten Section */}
            <div className="border-t border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Ongeplande Projecten
              </h3>
              <p className="text-sm text-gray-500 mt-2">Geen projecten te plannen.</p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-auto">
            {/* Days Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <div className="grid grid-cols-7">
                {weekDays.map((day, index) => (
                  <div key={index} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                    <div className="text-sm text-gray-600">{dayNames[index]}</div>
                    <div className={cn(
                      "text-2xl font-semibold mt-1",
                      isSameDay(day, new Date()) ? "text-red-500" : "text-gray-900"
                    )}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="relative">
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-7 border-b border-gray-100">
                  {weekDays.map((day, dayIndex) => (
                    <div 
                      key={dayIndex}
                      className="min-h-[80px] border-r border-gray-100 last:border-r-0 p-2 relative hover:bg-gray-50 cursor-pointer"
                      onClick={() => onTimeSlotClick?.(day, hour, filteredInstallers[0]?.id || '')}
                    >
                      {/* Time Label - only on first column */}
                      {dayIndex === 0 && (
                        <div className="absolute -left-12 top-0 text-xs text-gray-500">
                          {format(new Date().setHours(hour, 0), 'HH:mm')}
                        </div>
                      )}
                      
                      {/* Events for this time slot */}
                      {filteredInstallers.map((installer) => {
                        const installerEvents = getEventsForDateAndInstaller(day, installer.id);
                        const hourEvents = installerEvents.filter(event => {
                          const eventStart = parseInt(event.startTime.split(':')[0]);
                          const eventEnd = parseInt(event.endTime.split(':')[0]);
                          return hour >= eventStart && hour < eventEnd;
                        });

                        return hourEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                            className={cn(
                              "absolute inset-x-2 top-2 rounded p-2 text-xs cursor-pointer hover:shadow-md transition-shadow",
                              event.color
                            )}
                            style={{
                              backgroundColor: installer.color,
                              opacity: 0.9
                            }}
                          >
                            <div className="font-medium text-white truncate">{event.title}</div>
                            <div className="text-white text-xs opacity-90">
                              {event.startTime} - {event.endTime}
                            </div>
                          </div>
                        ));
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
  );
};
