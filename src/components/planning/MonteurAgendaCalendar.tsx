/**
 * Monteur Agenda Calendar
 * 
 * Month overview showing all monteurs and their daily availability.
 * Features:
 * - Color-coded days (green/yellow/red/gray/orange)
 * - Percentage and hours display
 * - Click to schedule
 * - Legend
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  calculateMonthAvailability,
  type DayAvailability,
} from '@/utils/monteurAvailabilityService';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface MonteurAgendaCalendarProps {
  /**
   * List of monteur IDs to show in calendar
   */
  monteurIds: string[];
  
  /**
   * Monteur data (id, name, etc)
   */
  monteurs: Array<{
    id: string;
    full_name?: string;
    email?: string;
  }>;
  
  /**
   * Initial month/year to display
   */
  initialDate?: Date;
  
  /**
   * Called when user clicks on a day cell
   */
  onDayClick?: (monteurId: string, date: Date, availability: DayAvailability) => void;
  
  /**
   * Loading state
   */
  loading?: boolean;
}

interface CalendarLegendItem {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  description: string;
  icon: string;
}

const LEGEND_ITEMS: CalendarLegendItem[] = [
  {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    label: 'Beschikbaar',
    description: '80-100% vrij',
    icon: '🟢',
  },
  {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    label: 'Gedeeltelijk',
    description: '20-80% vrij',
    icon: '🟡',
  },
  {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    label: 'Vol geboekt',
    description: '0-20% vrij',
    icon: '🔴',
  },
  {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    label: 'Verlof',
    description: 'Vrij/Vakantie',
    icon: '🟠',
  },
  {
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Geen werktijd',
    description: 'Niet beschikbaar',
    icon: '⚫',
  },
];

const COLOR_MAP = {
  green: {
    bg: 'bg-green-100 hover:bg-green-200',
    border: 'border-green-300',
    text: 'text-green-700',
  },
  yellow: {
    bg: 'bg-yellow-100 hover:bg-yellow-200',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
  },
  red: {
    bg: 'bg-red-100 hover:bg-red-200',
    border: 'border-red-300',
    text: 'text-red-700',
  },
  orange: {
    bg: 'bg-orange-100 hover:bg-orange-200',
    border: 'border-orange-300',
    text: 'text-orange-700',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-500',
  },
};

export function MonteurAgendaCalendar({
  monteurIds,
  monteurs,
  initialDate = new Date(),
  onDayClick,
  loading = false,
}: MonteurAgendaCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [availabilityData, setAvailabilityData] = useState<Map<string, Map<string, DayAvailability>>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);

  // OPTIMIZATION: Cache for availability data to prevent recalculation
  // Key format: "YYYY-MM-[monteurId1,monteurId2,...]"
  const [availabilityCache] = useState<Map<string, Map<string, Map<string, DayAvailability>>>>(
    new Map()
  );

  // Calculate month dates
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get weekday names
  const weekDays = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  // Generate cache key for current month and monteurs
  const getCacheKey = (date: Date, monteurIdsList: string[]) => {
    const sortedIds = [...monteurIdsList].sort().join(',');
    return `${format(date, 'yyyy-MM')}-[${sortedIds}]`;
  };

  // Load availability data for current month
  useEffect(() => {
    loadAvailabilityData();
  }, [currentMonth, monteurIds]);

  const loadAvailabilityData = async () => {
    if (monteurIds.length === 0) return;

    const cacheKey = getCacheKey(currentMonth, monteurIds);
    
    // OPTIMIZATION: Check cache first
    const cachedData = availabilityCache.get(cacheKey);
    if (cachedData) {
      console.log(`💾 Using cached availability data for ${format(currentMonth, 'MMMM yyyy', { locale: nl })}`);
      setAvailabilityData(cachedData);
      return;
    }

    setIsLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      console.log(`📅 Loading availability for ${format(currentMonth, 'MMMM yyyy', { locale: nl })}`);
      
      const data = await calculateMonthAvailability(monteurIds, year, month);
      setAvailabilityData(data);
      
      // OPTIMIZATION: Store in cache
      availabilityCache.set(cacheKey, data);
      
      // OPTIMIZATION: Limit cache size to prevent memory issues (keep last 6 months)
      if (availabilityCache.size > 6) {
        const firstKey = availabilityCache.keys().next().value;
        availabilityCache.delete(firstKey);
      }
      
      console.log(`✅ Loaded and cached availability for ${monteurIds.length} monteurs`);
    } catch (error) {
      console.error('Error loading availability data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayClick = (monteurId: string, date: Date) => {
    const monteurData = availabilityData.get(monteurId);
    if (!monteurData || !onDayClick) return;

    const dateStr = date.toISOString().split('T')[0];
    const availability = monteurData.get(dateStr);
    
    if (availability && availability.status !== 'outside_hours' && availability.status !== 'time_off') {
      onDayClick(monteurId, date, availability);
    }
  };

  const getMonteurName = (monteurId: string): string => {
    const monteur = monteurs.find((m) => m.id === monteurId);
    return monteur?.full_name || monteur?.email || 'Onbekend';
  };

  if (loading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monteur Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laden van beschikbaarheid...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (monteurIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monteur Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Geen monteurs beschikbaar om weer te geven.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Monteur Agenda
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Klik op een groene of gele dag om te plannen
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center min-w-[200px]">
                <p className="font-semibold">
                  {format(currentMonth, 'MMMM yyyy', { locale: nl })}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Legend */}
          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Legenda</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {LEGEND_ITEMS.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border ${item.bgColor} ${item.borderColor}`}
                  />
                  <div className="text-xs">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row with Day Names */}
              <div className="grid grid-cols-[150px_repeat(7,1fr)] gap-1 mb-2">
                <div className="font-medium text-sm text-muted-foreground">
                  Monteur
                </div>
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className="text-center font-medium text-sm text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Monteur Rows */}
              {monteurIds.map((monteurId) => {
                const monteurAvailability = availabilityData.get(monteurId);
                const monteurName = getMonteurName(monteurId);

                return (
                  <div key={monteurId} className="mb-3">
                    <div className="grid grid-cols-[150px_repeat(7,1fr)] gap-1">
                      {/* Monteur Name */}
                      <div className="flex items-center pr-2">
                        <p className="font-medium text-sm truncate">{monteurName}</p>
                      </div>

                      {/* Week Grid */}
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        // Find first day of month's weekday
                        const firstDayOfWeek = getDay(monthStart);
                        
                        // Calculate actual day number
                        const dayNumber = dayIndex - firstDayOfWeek + 1;
                        
                        if (dayNumber < 1 || dayNumber > daysInMonth.length) {
                          // Empty cell for days outside current month
                          return (
                            <div
                              key={dayIndex}
                              className="h-20 border border-gray-100 rounded bg-gray-50/50"
                            />
                          );
                        }

                        const date = daysInMonth[dayNumber - 1];
                        const dateStr = date.toISOString().split('T')[0];
                        const availability = monteurAvailability?.get(dateStr);

                        if (!availability) {
                          return (
                            <div
                              key={dayIndex}
                              className="h-20 border border-gray-200 rounded bg-gray-50 flex items-center justify-center"
                            >
                              <span className="text-xs text-muted-foreground">
                                {dayNumber}
                              </span>
                            </div>
                          );
                        }

                        const colors = COLOR_MAP[availability.color];
                        const isClickable =
                          availability.status === 'available' || availability.status === 'partial';
                        const isTodayDate = isToday(date);

                        return (
                          <TooltipProvider key={dayIndex}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleDayClick(monteurId, date)}
                                  disabled={!isClickable}
                                  className={`
                                    h-20 border rounded p-1 transition-colors
                                    ${colors.bg} ${colors.border}
                                    ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                                    ${isTodayDate ? 'ring-2 ring-primary' : ''}
                                    flex flex-col items-center justify-center
                                  `}
                                >
                                  <span className={`text-xs font-semibold ${colors.text} mb-1`}>
                                    {dayNumber}
                                  </span>
                                  
                                  {availability.status !== 'outside_hours' && (
                                    <>
                                      <Badge
                                        variant="secondary"
                                        className={`text-[10px] px-1 py-0 h-4 ${colors.text} bg-white/50`}
                                      >
                                        {availability.percentage}%
                                      </Badge>
                                      <span className={`text-[10px] ${colors.text} mt-0.5`}>
                                        {availability.availableHours.toFixed(1)}/{availability.totalHours.toFixed(1)}u
                                      </span>
                                    </>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <p className="font-semibold">
                                    {format(date, 'EEEE d MMMM', { locale: nl })}
                                  </p>
                                  <p>Monteur: {monteurName}</p>
                                  {availability.status !== 'outside_hours' && availability.status !== 'time_off' && (
                                    <>
                                      <p>
                                        Beschikbaar: {availability.availableHours.toFixed(1)} van{' '}
                                        {availability.totalHours.toFixed(1)} uur
                                      </p>
                                      <p>
                                        {availability.bookings.length} {availability.bookings.length === 1 ? 'afspraak' : 'afspraken'}
                                      </p>
                                    </>
                                  )}
                                  {availability.status === 'time_off' && <p>🟠 Verlof/Vrij</p>}
                                  {availability.status === 'outside_hours' && <p>⚫ Geen werktijd</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

