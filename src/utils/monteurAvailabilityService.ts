/**
 * Monteur Availability Service
 * 
 * Handles all calculations for monteur scheduling, availability, and conflicts.
 * Used by the planning system to determine when monteurs can be scheduled.
 */

import { supabase } from '@/integrations/supabase/client';
import { PlanningItem } from '@/hooks/usePlanningStore';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UserAvailability {
  user_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  break_start_time?: string | null;
  break_end_time?: string | null;
  is_available: boolean;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  status: 'available' | 'partial' | 'full' | 'outside_hours' | 'time_off';
  color: 'green' | 'yellow' | 'red' | 'gray' | 'orange';
  availableHours: number;
  totalHours: number;
  percentage: number;
  bookings: PlanningItem[];
  workHours?: {
    start: string;
    end: string;
    breakStart?: string;
    breakEnd?: string;
  };
}

export interface TimeConflict {
  existingBooking: PlanningItem;
  overlap: {
    start: string;
    end: string;
    durationMinutes: number;
  };
  severity: 'high' | 'medium' | 'low';
}

export interface DayPart {
  id: 'morning' | 'afternoon' | 'full_day';
  label: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Convert time string (HH:MM or HH:MM:SS) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

/**
 * Convert minutes since midnight to time string (HH:MM:SS)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

/**
 * Calculate duration in minutes between two time strings
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const startMinutes = timeToMinutes(time);
  const endMinutes = startMinutes + minutes;
  return minutesToTime(endMinutes);
}

/**
 * Check if time1 is before time2
 */
export function isTimeBefore(time1: string, time2: string): boolean {
  return timeToMinutes(time1) < timeToMinutes(time2);
}

/**
 * Check if times overlap
 */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return (s1 < e2 && e1 > s2);
}

// ============================================================================
// AVAILABILITY CALCULATIONS
// ============================================================================

/**
 * Calculate total available work hours for a day, accounting for breaks
 */
export function calculateTotalWorkHours(availability: UserAvailability): number {
  if (!availability.is_available) return 0;

  const startMinutes = timeToMinutes(availability.start_time);
  const endMinutes = timeToMinutes(availability.end_time);
  let totalMinutes = endMinutes - startMinutes;

  // Subtract break time if defined
  if (availability.break_start_time && availability.break_end_time) {
    const breakStart = timeToMinutes(availability.break_start_time);
    const breakEnd = timeToMinutes(availability.break_end_time);
    totalMinutes -= (breakEnd - breakStart);
  }

  return totalMinutes / 60; // Convert to hours
}

/**
 * Calculate booked hours from planning items
 */
export function calculateBookedHours(planningItems: PlanningItem[]): number {
  let totalMinutes = 0;

  for (const item of planningItems) {
    const duration = calculateDuration(item.start_time, item.end_time);
    totalMinutes += duration;
  }

  return totalMinutes / 60; // Convert to hours
}

/**
 * Calculate availability percentage
 */
export function calculateAvailabilityPercentage(
  availableHours: number,
  totalHours: number
): number {
  if (totalHours === 0) return 0;
  return Math.round((availableHours / totalHours) * 100);
}

/**
 * Determine day status based on availability percentage
 */
export function getDayStatus(
  percentage: number,
  hasBookings: boolean,
  isWorkDay: boolean,
  hasTimeOff: boolean
): DayAvailability['status'] {
  if (hasTimeOff) return 'time_off';
  if (!isWorkDay) return 'outside_hours';
  if (percentage >= 80) return 'available';
  if (percentage >= 20) return 'partial';
  return 'full';
}

/**
 * Get color for day status
 */
export function getStatusColor(status: DayAvailability['status']): DayAvailability['color'] {
  switch (status) {
    case 'available':
      return 'green';
    case 'partial':
      return 'yellow';
    case 'full':
      return 'red';
    case 'time_off':
      return 'orange';
    case 'outside_hours':
    default:
      return 'gray';
  }
}

/**
 * Calculate complete day availability for a monteur
 */
export async function calculateDayAvailability(
  monteurId: string,
  date: Date
): Promise<DayAvailability> {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.

  // Fetch user availability for this day of week
  const { data: availability } = await supabase
    .from('user_availability')
    .select('*')
    .eq('user_id', monteurId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  // Fetch existing planning items for this day
  const { data: planningItems } = await supabase
    .from('planning_items')
    .select('*')
    .eq('assigned_user_id', monteurId)
    .eq('start_date', dateStr);

  // Check for time off
  const { data: timeOff } = await supabase
    .from('user_time_off')
    .select('*')
    .eq('user_id', monteurId)
    .lte('start_date', dateStr)
    .gte('end_date', dateStr)
    .eq('status', 'approved')
    .maybeSingle();

  const hasTimeOff = !!timeOff;
  const bookings = (planningItems || []) as PlanningItem[];

  // If no availability set or not a work day
  if (!availability || !availability.is_available) {
    return {
      date: dateStr,
      status: hasTimeOff ? 'time_off' : 'outside_hours',
      color: hasTimeOff ? 'orange' : 'gray',
      availableHours: 0,
      totalHours: 0,
      percentage: 0,
      bookings,
    };
  }

  const totalHours = calculateTotalWorkHours(availability);
  const bookedHours = calculateBookedHours(bookings);
  const availableHours = Math.max(0, totalHours - bookedHours);
  const percentage = calculateAvailabilityPercentage(availableHours, totalHours);
  const status = getDayStatus(percentage, bookings.length > 0, true, hasTimeOff);
  const color = getStatusColor(status);

  return {
    date: dateStr,
    status,
    color,
    availableHours: Math.round(availableHours * 10) / 10, // Round to 1 decimal
    totalHours: Math.round(totalHours * 10) / 10,
    percentage,
    bookings,
    workHours: {
      start: availability.start_time,
      end: availability.end_time,
      breakStart: availability.break_start_time || undefined,
      breakEnd: availability.break_end_time || undefined,
    },
  };
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Check if a new time slot conflicts with existing bookings
 */
export function checkTimeConflict(
  existingBookings: PlanningItem[],
  newStartTime: string,
  newEndTime: string
): TimeConflict[] {
  const conflicts: TimeConflict[] = [];

  for (const booking of existingBookings) {
    if (timesOverlap(newStartTime, newEndTime, booking.start_time, booking.end_time)) {
      // Calculate overlap
      const overlapStart = isTimeBefore(newStartTime, booking.start_time)
        ? booking.start_time
        : newStartTime;
      const overlapEnd = isTimeBefore(newEndTime, booking.end_time)
        ? newEndTime
        : booking.end_time;
      const durationMinutes = calculateDuration(overlapStart, overlapEnd);

      // Determine severity
      let severity: TimeConflict['severity'] = 'low';
      if (durationMinutes >= 120) severity = 'high'; // 2+ hours
      else if (durationMinutes >= 60) severity = 'medium'; // 1-2 hours

      conflicts.push({
        existingBooking: booking,
        overlap: {
          start: overlapStart,
          end: overlapEnd,
          durationMinutes,
        },
        severity,
      });
    }
  }

  return conflicts;
}

/**
 * Check if a new booking is outside of work hours
 */
export function isOutsideWorkHours(
  startTime: string,
  endTime: string,
  workStart: string,
  workEnd: string
): boolean {
  return (
    isTimeBefore(startTime, workStart) ||
    isTimeBefore(workEnd, endTime)
  );
}

/**
 * Check if a new booking overlaps with break time
 */
export function overlapsWithBreak(
  startTime: string,
  endTime: string,
  breakStart?: string,
  breakEnd?: string
): boolean {
  if (!breakStart || !breakEnd) return false;
  return timesOverlap(startTime, endTime, breakStart, breakEnd);
}

// ============================================================================
// DAY PARTS (for Monteur scheduling)
// ============================================================================

/**
 * Get available day parts for a monteur based on their work hours
 */
export function getDayParts(workHours: {
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}): DayPart[] {
  const dayParts: DayPart[] = [];

  // Morning (start to break or midday)
  const morningEnd = workHours.breakStart || '12:00:00';
  dayParts.push({
    id: 'morning',
    label: 'Ochtend',
    startTime: workHours.start,
    endTime: morningEnd,
    durationMinutes: calculateDuration(workHours.start, morningEnd),
  });

  // Afternoon (break end or midday to end)
  const afternoonStart = workHours.breakEnd || '13:00:00';
  dayParts.push({
    id: 'afternoon',
    label: 'Middag',
    startTime: afternoonStart,
    endTime: workHours.end,
    durationMinutes: calculateDuration(afternoonStart, workHours.end),
  });

  // Full day (excluding break)
  const fullDayDuration =
    calculateDuration(workHours.start, workHours.end) -
    (workHours.breakStart && workHours.breakEnd
      ? calculateDuration(workHours.breakStart, workHours.breakEnd)
      : 0);

  dayParts.push({
    id: 'full_day',
    label: 'Hele dag',
    startTime: workHours.start,
    endTime: workHours.end,
    durationMinutes: fullDayDuration,
  });

  return dayParts;
}

/**
 * Get standard duration options for admin (in minutes)
 */
export function getAdminDurationOptions(): Array<{ value: number; label: string }> {
  return [
    { value: 60, label: '1 uur' },
    { value: 120, label: '2 uur' },
    { value: 240, label: '4 uur (halve dag)' },
    { value: 480, label: '8 uur (hele dag)' },
  ];
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Calculate availability for multiple monteurs for a month
 * 
 * SUPER OPTIMIZED: Batch fetches ALL data upfront (3 queries total) instead of 
 * making individual queries per day (270+ queries). Then processes data in memory.
 * Performance improvement: ~30 seconds → ~0.5-1 seconds
 */
export async function calculateMonthAvailability(
  monteurIds: string[],
  year: number,
  month: number
): Promise<Map<string, Map<string, DayAvailability>>> {
  const result = new Map<string, Map<string, DayAvailability>>();

  if (monteurIds.length === 0) {
    return result;
  }

  // Get first and last day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDateStr = firstDay.toISOString().split('T')[0];
  const lastDateStr = lastDay.toISOString().split('T')[0];

  console.log(`📊 Batch fetching data for ${monteurIds.length} monteurs × ${daysInMonth} days`);
  const startTime = performance.now();

  // OPTIMIZATION 1: Batch fetch all data for the month in 3 queries instead of 270+
  const [availabilitiesResult, planningItemsResult, timeOffResult] = await Promise.all([
    // Fetch all user availability patterns (recurring by day of week)
    supabase
      .from('user_availability')
      .select('*')
      .in('user_id', monteurIds),
    
    // Fetch all planning items for the month
    supabase
      .from('planning_items')
      .select('*')
      .in('assigned_user_id', monteurIds)
      .gte('start_date', firstDateStr)
      .lte('start_date', lastDateStr),
    
    // Fetch all time off for the month
    supabase
      .from('user_time_off')
      .select('*')
      .in('user_id', monteurIds)
      .eq('status', 'approved')
      .or(`and(start_date.lte.${lastDateStr},end_date.gte.${firstDateStr})`)
  ]);

  const fetchTime = performance.now();
  console.log(`✅ Fetched all data in ${(fetchTime - startTime).toFixed(0)}ms`);

  // Index data by user ID for fast lookup
  const availabilitiesByUser = new Map<string, UserAvailability[]>();
  (availabilitiesResult.data || []).forEach(avail => {
    if (!availabilitiesByUser.has(avail.user_id)) {
      availabilitiesByUser.set(avail.user_id, []);
    }
    availabilitiesByUser.get(avail.user_id)!.push(avail);
  });

  // Index planning items by user and date
  const planningByUserDate = new Map<string, Map<string, PlanningItem[]>>();
  (planningItemsResult.data || []).forEach(item => {
    if (!planningByUserDate.has(item.assigned_user_id)) {
      planningByUserDate.set(item.assigned_user_id, new Map());
    }
    const userPlanning = planningByUserDate.get(item.assigned_user_id)!;
    if (!userPlanning.has(item.start_date)) {
      userPlanning.set(item.start_date, []);
    }
    userPlanning.get(item.start_date)!.push(item as PlanningItem);
  });

  // Index time off by user
  const timeOffByUser = new Map<string, any[]>();
  (timeOffResult.data || []).forEach(timeOff => {
    if (!timeOffByUser.has(timeOff.user_id)) {
      timeOffByUser.set(timeOff.user_id, []);
    }
    timeOffByUser.get(timeOff.user_id)!.push(timeOff);
  });

  // OPTIMIZATION 2: Process all days in memory (no more queries)
  for (const monteurId of monteurIds) {
    const monteurAvailability = new Map<string, DayAvailability>();
    const userAvailabilities = availabilitiesByUser.get(monteurId) || [];
    const userPlanning = planningByUserDate.get(monteurId);
    const userTimeOff = timeOffByUser.get(monteurId) || [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // Find availability for this day of week
      const availability = userAvailabilities.find(a => a.day_of_week === dayOfWeek);
      
      // Get planning for this day
      const bookings = userPlanning?.get(dateStr) || [];
      
      // Check for time off
      const hasTimeOff = userTimeOff.some(
        to => to.start_date <= dateStr && to.end_date >= dateStr
      );

      // Calculate day availability
      if (!availability || !availability.is_available) {
        monteurAvailability.set(dateStr, {
          date: dateStr,
          status: hasTimeOff ? 'time_off' : 'outside_hours',
          color: hasTimeOff ? 'orange' : 'gray',
          availableHours: 0,
          totalHours: 0,
          percentage: 0,
          bookings,
        });
      } else {
        const totalHours = calculateTotalWorkHours(availability);
        const bookedHours = calculateBookedHours(bookings);
        const availableHours = Math.max(0, totalHours - bookedHours);
        const percentage = calculateAvailabilityPercentage(availableHours, totalHours);
        const status = getDayStatus(percentage, bookings.length > 0, true, hasTimeOff);
        const color = getStatusColor(status);

        monteurAvailability.set(dateStr, {
          date: dateStr,
          status,
          color,
          availableHours: Math.round(availableHours * 10) / 10,
          totalHours: Math.round(totalHours * 10) / 10,
          percentage,
          bookings,
          workHours: {
            start: availability.start_time,
            end: availability.end_time,
            breakStart: availability.break_start_time || undefined,
            breakEnd: availability.break_end_time || undefined,
          },
        });
      }
    }

    result.set(monteurId, monteurAvailability);
  }

  const endTime = performance.now();
  console.log(`✅ Processed ${monteurIds.length * daysInMonth} day availabilities in ${(endTime - startTime).toFixed(0)}ms total (${((endTime - startTime) / (monteurIds.length * daysInMonth)).toFixed(1)}ms per day)`);

  return result;
}

/**
 * Find best available time slot for a monteur on a given day
 */
export async function findBestTimeSlot(
  monteurId: string,
  date: Date,
  durationMinutes: number
): Promise<{ start: string; end: string } | null> {
  const availability = await calculateDayAvailability(monteurId, date);

  if (!availability.workHours || availability.status === 'full' || availability.status === 'outside_hours') {
    return null;
  }

  // Try to find a slot that doesn't conflict with existing bookings
  const workStart = timeToMinutes(availability.workHours.start);
  const workEnd = timeToMinutes(availability.workHours.end);
  
  // Sort bookings by start time
  const sortedBookings = [...availability.bookings].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );

  let currentTime = workStart;

  // Check before first booking
  if (sortedBookings.length === 0) {
    return {
      start: minutesToTime(currentTime),
      end: minutesToTime(currentTime + durationMinutes),
    };
  }

  // Check gaps between bookings
  for (const booking of sortedBookings) {
    const bookingStart = timeToMinutes(booking.start_time);
    const gapDuration = bookingStart - currentTime;

    if (gapDuration >= durationMinutes) {
      return {
        start: minutesToTime(currentTime),
        end: minutesToTime(currentTime + durationMinutes),
      };
    }

    currentTime = timeToMinutes(booking.end_time);
  }

  // Check after last booking
  if (workEnd - currentTime >= durationMinutes) {
    return {
      start: minutesToTime(currentTime),
      end: minutesToTime(currentTime + durationMinutes),
    };
  }

  return null; // No available slot found
}

