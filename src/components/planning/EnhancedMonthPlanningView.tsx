/**
 * Enhanced Month Planning View
 * 
 * Modern month calendar view with monteur avatars and full-screen optimization.
 * Features:
 * - Monteur avatars (colored icons with initials)
 * - Multiple monteurs per planning item
 * - Full-screen responsive layout
 * - Click to view/edit planning items
 * - Color-coded by monteur
 */

import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  isSameDay,
  getDay
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MultiUserAvatars } from '@/components/ui/user-avatar';
import { getUserColor, type User } from '@/utils/userColorService';
import { cn } from '@/lib/utils';
import type { PlanningItem } from '@/hooks/usePlanningStore';

export interface EnhancedMonthPlanningViewProps {
  planningItems: PlanningItem[];
  users: User[];
  onDateClick?: (date: Date) => void;
  onPlanningClick?: (planning: PlanningItem) => void;
  loading?: boolean;
}

export function EnhancedMonthPlanningView({
  planningItems,
  users,
  onDateClick,
  onPlanningClick,
  loading = false,
}: EnhancedMonthPlanningViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Calculate month boundaries
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days to complete the weeks
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday start

  const endDayOfWeek = getDay(monthEnd);
  const trailingDays = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;

  // Create all days to display (including padding)
  const allDays = [
    ...Array.from({ length: paddingDays }, (_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (paddingDays - i));
      return { date, isCurrentMonth: false };
    }),
    ...daysInMonth.map(date => ({ date, isCurrentMonth: true })),
    ...Array.from({ length: trailingDays }, (_, i) => {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i + 1);
      return { date, isCurrentMonth: false };
    }),
  ];

  // Group planning items by date
  const planningByDate = useMemo(() => {
    const grouped = new Map<string, PlanningItem[]>();
    
    planningItems.forEach(item => {
      const dateKey = item.start_date;
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(item);
    });
    
    return grouped;
  }, [planningItems]);

  // Get planning for a specific date
  const getPlanningForDate = (date: Date): PlanningItem[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return planningByDate.get(dateKey) || [];
  };

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Planning laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {format(currentMonth, 'MMMM yyyy', { locale: nl })}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Vandaag
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="h-full flex flex-col">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {dayNames.map((day, index) => (
                <div
                  key={index}
                  className="text-center py-3 text-sm font-semibold text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: '1fr' }}>
              {allDays.map(({ date, isCurrentMonth }, index) => {
                const dayPlanning = getPlanningForDate(date);
                const isCurrentDay = isToday(date);

                return (
                  <div
                    key={index}
                    className={cn(
                      'border-b border-r last:border-r-0',
                      !isCurrentMonth && 'bg-muted/30',
                      'hover:bg-muted/50 transition-colors cursor-pointer',
                      'min-h-[120px] flex flex-col'
                    )}
                    onClick={() => onDateClick?.(date)}
                  >
                    {/* Day Number */}
                    <div className="p-2">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm',
                          isCurrentDay && 'bg-[hsl(0,71%,36%)] text-white font-bold',
                          !isCurrentDay && isCurrentMonth && 'text-gray-900 font-medium',
                          !isCurrentDay && !isCurrentMonth && 'text-gray-400'
                        )}
                      >
                        {format(date, 'd')}
                      </span>
                    </div>

                    {/* Planning Items */}
                    <div className="flex-1 px-2 pb-2 space-y-1 overflow-y-auto max-h-[150px]">
                      {dayPlanning.slice(0, 4).map((planning) => {
                        const assignedUser = users.find(u => u.id === planning.assigned_user_id);
                        const colorScheme = assignedUser 
                          ? getUserColor(assignedUser.id, users)
                          : { bg: '#6B7280', light: '#F3F4F6', text: '#FFFFFF' };

                        return (
                          <div
                            key={planning.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlanningClick?.(planning);
                            }}
                            className={cn(
                              'group rounded-md p-1.5 text-xs transition-all',
                              'hover:shadow-md cursor-pointer',
                              'border-l-2'
                            )}
                            style={{
                              backgroundColor: colorScheme.light,
                              borderLeftColor: colorScheme.bg,
                            }}
                          >
                            <div className="flex items-start gap-1.5">
                              {/* Avatar */}
                              {assignedUser && (
                                <div className="flex-shrink-0">
                                  <MultiUserAvatars
                                    users={[assignedUser]}
                                    allUsers={users}
                                    size="xs"
                                    showTooltip={true}
                                    overlap={false}
                                  />
                                </div>
                              )}
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate leading-tight">
                                  {planning.title}
                                </p>
                                {planning.start_time && (
                                  <p className="text-[10px] text-gray-600 mt-0.5">
                                    {planning.start_time.substring(0, 5)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Show "more" indicator if there are more than 4 items */}
                      {dayPlanning.length > 4 && (
                        <div className="text-[10px] text-muted-foreground text-center py-1">
                          +{dayPlanning.length - 4} meer
                        </div>
                      )}
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

