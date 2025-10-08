/**
 * Duration Selector Component
 * 
 * Smart selector that adapts based on user role:
 * - Admin: Select duration in hours (1, 2, 4, 8)
 * - Monteur: Select day parts (Ochtend, Middag, Hele dag)
 */

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Sun, Sunset, Calendar as CalendarIcon } from 'lucide-react';
import {
  getAdminDurationOptions,
  getDayParts,
  type DayPart,
} from '@/utils/monteurAvailabilityService';

export interface DurationSelectorProps {
  /**
   * User role determines which selector to show
   */
  userRole: 'admin' | 'monteur';
  
  /**
   * Current selected duration in minutes
   */
  value: number;
  
  /**
   * Callback when duration changes
   */
  onChange: (durationMinutes: number, meta?: {
    startTime?: string;
    endTime?: string;
    dayPartId?: string;
  }) => void;
  
  /**
   * Monteur work hours (required for monteur role to calculate day parts)
   */
  monteurWorkHours?: {
    start: string;
    end: string;
    breakStart?: string;
    breakEnd?: string;
  };
  
  /**
   * Optional label override
   */
  label?: string;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
}

const DURATION_ICONS = {
  60: <Clock className="h-4 w-4" />,
  120: <Clock className="h-4 w-4" />,
  240: <Sun className="h-4 w-4" />,
  480: <CalendarIcon className="h-4 w-4" />,
};

const DAYPART_ICONS = {
  morning: <Sun className="h-4 w-4" />,
  afternoon: <Sunset className="h-4 w-4" />,
  full_day: <CalendarIcon className="h-4 w-4" />,
};

export function DurationSelector({
  userRole,
  value,
  onChange,
  monteurWorkHours,
  label,
  disabled = false,
}: DurationSelectorProps) {
  const [dayParts, setDayParts] = useState<DayPart[]>([]);
  const [adminDurations] = useState(() => getAdminDurationOptions());

  // Calculate day parts for monteur
  useEffect(() => {
    if (userRole === 'monteur' && monteurWorkHours) {
      const parts = getDayParts(monteurWorkHours);
      setDayParts(parts);
      
      // If no value set yet, default to morning
      if (!value && parts.length > 0) {
        onChange(parts[0].durationMinutes, {
          startTime: parts[0].startTime,
          endTime: parts[0].endTime,
          dayPartId: parts[0].id,
        });
      }
    }
  }, [userRole, monteurWorkHours, value, onChange]);

  // Admin View: Hour-based selection
  if (userRole === 'admin') {
    return (
      <div className="space-y-2">
        <Label htmlFor="duration-selector">
          {label || 'Duur'}
        </Label>
        <Select
          value={value?.toString() || ''}
          onValueChange={(val) => {
            const minutes = parseInt(val, 10);
            onChange(minutes);
          }}
          disabled={disabled}
        >
          <SelectTrigger id="duration-selector">
            <SelectValue placeholder="Selecteer duur" />
          </SelectTrigger>
          <SelectContent>
            {adminDurations.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                <div className="flex items-center gap-2">
                  {DURATION_ICONS[option.value as keyof typeof DURATION_ICONS]}
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {value && (
          <p className="text-sm text-muted-foreground">
            Geselecteerd: <strong>{value / 60} uur</strong>
          </p>
        )}
      </div>
    );
  }

  // Monteur View: Day part selection
  if (userRole === 'monteur') {
    if (!monteurWorkHours) {
      return (
        <div className="space-y-2">
          <Label>{label || 'Dagdeel'}</Label>
          <div className="text-sm text-destructive">
            ⚠️ Geen werktijden ingesteld voor deze monteur.
          </div>
        </div>
      );
    }

    if (dayParts.length === 0) {
      return (
        <div className="space-y-2">
          <Label>{label || 'Dagdeel'}</Label>
          <div className="text-sm text-muted-foreground">
            Berekenen van beschikbare dagdelen...
          </div>
        </div>
      );
    }

    const selectedDayPart = dayParts.find((dp) => dp.durationMinutes === value);

    return (
      <div className="space-y-2">
        <Label htmlFor="daypart-selector">
          {label || 'Dagdeel'}
        </Label>
        <Select
          value={selectedDayPart?.id || ''}
          onValueChange={(dayPartId) => {
            const dayPart = dayParts.find((dp) => dp.id === dayPartId);
            if (dayPart) {
              onChange(dayPart.durationMinutes, {
                startTime: dayPart.startTime,
                endTime: dayPart.endTime,
                dayPartId: dayPart.id,
              });
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger id="daypart-selector">
            <SelectValue placeholder="Selecteer dagdeel" />
          </SelectTrigger>
          <SelectContent>
            {dayParts.map((dayPart) => (
              <SelectItem key={dayPart.id} value={dayPart.id}>
                <div className="flex items-center gap-2">
                  {DAYPART_ICONS[dayPart.id as keyof typeof DAYPART_ICONS]}
                  <div className="flex flex-col">
                    <span>{dayPart.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {dayPart.startTime.slice(0, 5)} - {dayPart.endTime.slice(0, 5)}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedDayPart && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>{selectedDayPart.label}</strong>
            </p>
            <p className="text-xs">
              {selectedDayPart.startTime.slice(0, 5)} tot {selectedDayPart.endTime.slice(0, 5)} 
              ({Math.round(selectedDayPart.durationMinutes / 60 * 10) / 10}u)
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

