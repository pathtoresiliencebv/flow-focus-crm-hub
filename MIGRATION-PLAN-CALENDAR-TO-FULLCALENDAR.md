# 📅 MIGRATIE PLAN: Custom Calendar → FullCalendar Integration

**Datum:** 3 Oktober 2025  
**Status:** PLANNING  
**Impact:** Medium - Planning/Calendar functionaliteit wordt verbeterd

---

## 🎯 **DOEL**

Huidige custom-built planning/calendar vervangen met FullCalendar library (zoals Roundcube), waarbij:
- ✅ Elke gebruiker heeft zijn eigen kalender view
- ✅ Administrator kan planning maken voor alle gebruikers
- ✅ Simplex theme (clean, rood/wit design uit screenshot)
- ✅ Bestaande planning data blijft behouden
- ✅ Synchronisatie met email calendar invites (iCal)
- ✅ Mobile responsive
- ✅ Andere CRM functionaliteiten NIET kapot gaan

---

## 📊 **HUIDIGE SITUATIE**

### **Bestaande Database Schema:**
```sql
✅ planning_items (id, project_id, assigned_user_id, start_date, start_time, end_time)
✅ projects (id, customer_id, assigned_user_id, status, ...)
✅ profiles (id, full_name, role, ...)
```

### **Bestaande Components:**
```
✅ src/components/SimplifiedPlanningManagement.tsx - Hoofd planning pagina
✅ src/components/planning/EnhancedPlanningAgenda.tsx - Week agenda view
✅ src/components/planning/SlideInPlanningPanel.tsx - Planning panel
✅ src/components/WeekCalendar.tsx - Custom week calendar
✅ src/components/MonthCalendar.tsx - Custom month calendar
✅ src/components/planning/PlanningCalendarView.tsx - Calendar wrapper
```

### **Huidige Functionaliteit:**
- ✅ Week/Month view switcher
- ✅ Planning items gekoppeld aan projecten
- ✅ Installer filtering
- ✅ Drag & drop (beperkt)
- ✅ Planning panel voor direct inplannen

---

## 🏗️ **NIEUWE ARCHITECTUUR MET FULLCALENDAR**

### **1. Database Wijzigingen**

#### **A. Nieuwe table: `calendar_events`**
```sql
-- Nieuwe table voor calendar events (sync van planning_items + email events)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'Europe/Amsterdam',
  
  -- Koppeling met bestaande data
  planning_item_id UUID REFERENCES planning_items(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- FullCalendar properties
  color TEXT DEFAULT '#d9230f', -- Simplex red
  background_color TEXT,
  border_color TEXT,
  text_color TEXT DEFAULT '#ffffff',
  
  -- Recurrence (voor terugkerende events)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE format: FREQ=WEEKLY;BYDAY=MO,WE,FR
  recurrence_exception JSONB, -- Excluded dates
  
  -- Attendees (voor toekomstige multi-user events)
  attendees JSONB DEFAULT '[]', -- [{user_id, email, name, status: 'accepted'|'declined'|'tentative'}]
  organizer_id UUID REFERENCES profiles(id),
  
  -- Email calendar integration
  ical_uid TEXT UNIQUE, -- Voor iCal sync
  ical_sequence INTEGER DEFAULT 0,
  email_sent BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'tentative', 'cancelled'
  is_private BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, start_date, end_date);
CREATE INDEX idx_calendar_events_planning ON calendar_events(planning_item_id);
CREATE INDEX idx_calendar_events_project ON calendar_events(project_id);
CREATE INDEX idx_calendar_events_ical ON calendar_events(ical_uid);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar events" ON calendar_events
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    -- Admins can view all events
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Administrator', 'Administratie')
    )
  );

CREATE POLICY "Users can create their own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR organizer_id = auth.uid()
  );

CREATE POLICY "Users can update their own calendar events" ON calendar_events
  FOR UPDATE USING (
    user_id = auth.uid()
    OR organizer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Administrator', 'Administratie')
    )
  );

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
  FOR DELETE USING (
    user_id = auth.uid()
    OR organizer_id = auth.uid()
  );

-- Function to sync planning_items to calendar_events
CREATE OR REPLACE FUNCTION sync_planning_to_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- When planning_item is created/updated, create/update calendar_event
  INSERT INTO calendar_events (
    user_id,
    title,
    description,
    start_date,
    end_date,
    planning_item_id,
    project_id,
    color,
    status
  )
  VALUES (
    NEW.assigned_user_id,
    COALESCE(NEW.title, (SELECT title FROM projects WHERE id = NEW.project_id)),
    NEW.description,
    (NEW.start_date || ' ' || NEW.start_time)::TIMESTAMPTZ,
    (NEW.start_date || ' ' || NEW.end_time)::TIMESTAMPTZ,
    NEW.id,
    NEW.project_id,
    '#d9230f', -- Simplex red
    NEW.status
  )
  ON CONFLICT (planning_item_id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status = EXCLUDED.status,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-sync planning_items
DROP TRIGGER IF EXISTS sync_planning_to_calendar_trigger ON planning_items;
CREATE TRIGGER sync_planning_to_calendar_trigger
  AFTER INSERT OR UPDATE ON planning_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_planning_to_calendar();

-- Function to delete calendar_event when planning_item is deleted
CREATE OR REPLACE FUNCTION delete_calendar_event_on_planning_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM calendar_events WHERE planning_item_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS delete_calendar_event_trigger ON planning_items;
CREATE TRIGGER delete_calendar_event_trigger
  BEFORE DELETE ON planning_items
  FOR EACH ROW
  EXECUTE FUNCTION delete_calendar_event_on_planning_delete();
```

#### **B. Update existing tables (OPTIONAL):**
```sql
-- Add calendar sync flag to planning_items (optional)
ALTER TABLE planning_items
  ADD COLUMN IF NOT EXISTS calendar_synced BOOLEAN DEFAULT true;

-- Add color preference to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS calendar_color TEXT DEFAULT '#3788d8';
```

---

### **2. Frontend - FullCalendar Setup**

#### **A. Package Installation**
```bash
pnpm add @fullcalendar/core
pnpm add @fullcalendar/react
pnpm add @fullcalendar/daygrid
pnpm add @fullcalendar/timegrid
pnpm add @fullcalendar/interaction
pnpm add @fullcalendar/list
pnpm add @fullcalendar/rrule
pnpm add rrule
```

#### **B. Nieuwe Component: `FullCalendarView.tsx`**
```typescript
// src/components/calendar/FullCalendarView.tsx

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import rrulePlugin from '@fullcalendar/rrule';
import nlLocale from '@fullcalendar/core/locales/nl';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import './fullcalendar-simplex-theme.css'; // Custom Simplex theme

interface FullCalendarViewProps {
  userId?: string; // Voor admin view: filter by user
  showAllUsers?: boolean; // Admin kan alle users zien
  editable?: boolean;
  onEventCreate?: (start: Date, end: Date) => void;
  onEventEdit?: (eventId: string) => void;
}

export const FullCalendarView: React.FC<FullCalendarViewProps> = ({
  userId,
  showAllUsers = false,
  editable = true,
  onEventCreate,
  onEventEdit,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const { events, loading, createEvent, updateEvent, deleteEvent } = useCalendarEvents(userId, showAllUsers);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Transform database events to FullCalendar format
  const fullCalendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start_date,
    end: event.end_date,
    allDay: event.all_day,
    backgroundColor: event.color || event.background_color,
    borderColor: event.border_color || event.color,
    textColor: event.text_color,
    extendedProps: {
      description: event.description,
      location: event.location,
      projectId: event.project_id,
      planningItemId: event.planning_item_id,
      status: event.status,
      attendees: event.attendees,
    },
    // Recurrence support
    ...(event.is_recurring && {
      rrule: event.recurrence_rule,
      exdate: event.recurrence_exception,
    }),
  }));

  const handleEventClick = (info: EventClickArg) => {
    if (onEventEdit) {
      onEventEdit(info.event.id);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onEventCreate) {
      onEventCreate(selectInfo.start, selectInfo.end);
    }
  };

  const handleEventDrop = async (info: EventDropArg) => {
    try {
      await updateEvent(info.event.id, {
        start_date: info.event.start,
        end_date: info.event.end,
      });
    } catch (error) {
      console.error('Error updating event:', error);
      info.revert();
    }
  };

  const handleEventResize = async (info: EventDropArg) => {
    try {
      await updateEvent(info.event.id, {
        start_date: info.event.start,
        end_date: info.event.end,
      });
    } catch (error) {
      console.error('Error resizing event:', error);
      info.revert();
    }
  };

  return (
    <Card className="p-6">
      <FullCalendar
        ref={calendarRef}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          listPlugin,
          rrulePlugin,
        ]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        buttonText={{
          today: 'Vandaag',
          month: 'Maand',
          week: 'Week',
          day: 'Dag',
          list: 'Lijst',
        }}
        locale={nlLocale}
        events={fullCalendarEvents}
        editable={editable}
        selectable={editable}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        nowIndicator={true}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={true}
        // Business hours (werktijden)
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
          startTime: '08:00',
          endTime: '18:00',
        }}
        // Loading state
        loading={loading}
      />
    </Card>
  );
};
```

#### **C. Simplex Theme CSS**
```css
/* src/components/calendar/fullcalendar-simplex-theme.css */

/* Simplex-inspired FullCalendar Theme (red/white clean design) */

:root {
  --fc-primary-color: #d9230f; /* Simplex red */
  --fc-border-color: #e5e7eb;
  --fc-today-bg-color: #fff8e1;
  --fc-event-bg-color: #d9230f;
  --fc-event-border-color: #ad1d0c;
  --fc-event-text-color: #ffffff;
  --fc-button-bg-color: #d9230f;
  --fc-button-border-color: #d9230f;
  --fc-button-hover-bg-color: #ad1d0c;
  --fc-button-hover-border-color: #ad1d0c;
  --fc-button-active-bg-color: #8b1709;
}

/* Override default FullCalendar styles */
.fc {
  font-family: 'Inter', sans-serif;
}

.fc .fc-toolbar-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.fc .fc-button {
  background-color: var(--fc-button-bg-color);
  border-color: var(--fc-button-border-color);
  color: white;
  font-weight: 500;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  transition: all 0.2s;
}

.fc .fc-button:hover {
  background-color: var(--fc-button-hover-bg-color);
  border-color: var(--fc-button-hover-border-color);
}

.fc .fc-button:active,
.fc .fc-button-active {
  background-color: var(--fc-button-active-bg-color);
  box-shadow: 0 2px 8px rgba(217, 35, 15, 0.3);
}

.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
  background-color: var(--fc-button-active-bg-color);
}

/* Day grid styling */
.fc .fc-daygrid-day {
  transition: background-color 0.2s;
}

.fc .fc-daygrid-day:hover {
  background-color: #f9fafb;
  cursor: pointer;
}

.fc .fc-day-today {
  background-color: var(--fc-today-bg-color) !important;
}

/* Event styling */
.fc-event {
  background-color: var(--fc-event-bg-color);
  border-color: var(--fc-event-border-color);
  color: var(--fc-event-text-color);
  border-radius: 0.25rem;
  padding: 2px 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.fc-event:hover {
  box-shadow: 0 2px 8px rgba(217, 35, 15, 0.4);
  transform: translateY(-1px);
}

.fc-event-title {
  font-weight: 500;
}

/* Time grid styling */
.fc .fc-timegrid-slot {
  height: 3rem;
}

.fc .fc-timegrid-slot-label {
  border-right: 1px solid var(--fc-border-color);
}

.fc .fc-timegrid-now-indicator-line {
  border-color: var(--fc-primary-color);
  border-width: 2px;
}

/* List view styling */
.fc .fc-list-event:hover td {
  background-color: #fef2f2;
}

.fc .fc-list-event-dot {
  background-color: var(--fc-event-bg-color);
  border-color: var(--fc-event-border-color);
}

/* Business hours background */
.fc .fc-non-business {
  background-color: #f9fafb;
}
```

#### **D. Custom Hook: `useCalendarEvents.ts`**
```typescript
// src/hooks/useCalendarEvents.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  color?: string;
  background_color?: string;
  border_color?: string;
  text_color?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  recurrence_exception?: any;
  planning_item_id?: string;
  project_id?: string;
  attendees?: any[];
  status: string;
  is_private: boolean;
}

export const useCalendarEvents = (userId?: string, showAllUsers: boolean = false) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (!showAllUsers) {
        // Only show events for specific user or current user
        query = query.eq('user_id', userId || user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('calendar_events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: showAllUsers ? undefined : `user_id=eq.${userId || user?.id}`,
        },
        (payload) => {
          console.log('Calendar event changed:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, showAllUsers, user?.id]);

  const createEvent = async (eventData: Partial<CalendarEvent>) => {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: userId || user?.id,
        ...eventData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  };

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};
```

---

### **3. Integration Points**

#### **A. Replace `SimplifiedPlanningManagement.tsx`**
```typescript
// src/components/planning/PlanningManagement.tsx (NEW)

import React, { useState } from 'react';
import { FullCalendarView } from '@/components/calendar/FullCalendarView';
import { PlanningEventDialog } from '@/components/planning/PlanningEventDialog';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const PlanningManagement = () => {
  const { user, profile } = useAuth();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'Administrator' || profile?.role === 'Administratie';

  const handleEventCreate = (start: Date, end: Date) => {
    setSelectedDates({ start, end });
    setSelectedEventId(null);
    setShowEventDialog(true);
  };

  const handleEventEdit = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedDates(null);
    setShowEventDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planning</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? 'Beheer planning voor alle monteurs' : 'Jouw persoonlijke planning'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => {}}>
              <Users className="h-4 w-4 mr-2" />
              Alle Monteurs
            </Button>
          )}
          <Button onClick={() => setShowEventDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuw Event
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <FullCalendarView
        userId={isAdmin ? undefined : user?.id}
        showAllUsers={isAdmin}
        editable={isAdmin}
        onEventCreate={handleEventCreate}
        onEventEdit={handleEventEdit}
      />

      {/* Event Dialog */}
      {showEventDialog && (
        <PlanningEventDialog
          eventId={selectedEventId}
          initialDates={selectedDates}
          onClose={() => setShowEventDialog(false)}
          onSave={() => {
            setShowEventDialog(false);
            // Refresh handled by realtime subscription
          }}
        />
      )}
    </div>
  );
};
```

---

## 🔄 **MIGRATIE STAPPEN**

### **FASE 1: Database Setup (Dag 1)**
- [ ] 1.1 Create `calendar_events` table
- [ ] 1.2 Create sync triggers for `planning_items`
- [ ] 1.3 Initial data migration: sync existing planning_items
  ```sql
  -- Migrate existing planning_items to calendar_events
  INSERT INTO calendar_events (
    user_id, title, start_date, end_date, 
    planning_item_id, project_id, color, status
  )
  SELECT 
    pi.assigned_user_id,
    COALESCE(pi.title, p.title),
    (pi.start_date || ' ' || pi.start_time)::TIMESTAMPTZ,
    (pi.start_date || ' ' || pi.end_time)::TIMESTAMPTZ,
    pi.id,
    pi.project_id,
    '#d9230f',
    pi.status
  FROM planning_items pi
  LEFT JOIN projects p ON p.id = pi.project_id
  ON CONFLICT (planning_item_id) DO NOTHING;
  ```
- [ ] 1.4 Test queries & RLS policies

### **FASE 2: FullCalendar Installation (Dag 2)**
- [ ] 2.1 Install packages: `@fullcalendar/*`
- [ ] 2.2 Create `FullCalendarView.tsx` component
- [ ] 2.3 Create Simplex theme CSS
- [ ] 2.4 Test basic rendering

### **FASE 3: Hooks & Utilities (Dag 3)**
- [ ] 3.1 Create `useCalendarEvents.ts` hook
- [ ] 3.2 Test CRUD operations
- [ ] 3.3 Test realtime subscriptions
- [ ] 3.4 Create event helpers (formatters, validators)

### **FASE 4: UI Components (Dag 4-5)**
- [ ] 4.1 Create `PlanningManagement.tsx` (new main component)
- [ ] 4.2 Create `PlanningEventDialog.tsx` (create/edit event)
- [ ] 4.3 Update `src/pages/Index.tsx` to use new component
- [ ] 4.4 Style adjustments for Simplex theme

### **FASE 5: Integration (Dag 6)**
- [ ] 5.1 Update project planning views to use FullCalendar
- [ ] 5.2 Update mobile planning views
- [ ] 5.3 Test drag & drop
- [ ] 5.4 Test recurring events
- [ ] 5.5 Test multi-user view (admin)

### **FASE 6: Cleanup (Dag 7)**
- [ ] 6.1 KEEP oude components als fallback:
  ```
  ✅ SimplifiedPlanningManagement.tsx → Rename to _LegacyPlanningManagement.tsx
  ✅ EnhancedPlanningAgenda.tsx → Archive
  ✅ WeekCalendar.tsx → Archive (FullCalendar heeft dit)
  ✅ MonthCalendar.tsx → Archive (FullCalendar heeft dit)
  ```
- [ ] 6.2 Update navigation/routing
- [ ] 6.3 Update documentation

### **FASE 7: Testing (Dag 8-9)**
- [ ] 7.1 Test als administrator (all users view)
- [ ] 7.2 Test als monteur (own calendar)
- [ ] 7.3 Test event creation/edit/delete
- [ ] 7.4 Test drag & drop
- [ ] 7.5 Test mobile responsive
- [ ] 7.6 Test sync met planning_items
- [ ] 7.7 Performance testing (100+ events)

---

## ⚠️ **BACKWARDS COMPATIBILITY**

### **Wat Blijft Werken:**
✅ Alle bestaande planning_items blijven in database  
✅ Project → planning koppeling blijft intact  
✅ Planning notifications blijven werken  
✅ Mobile app blijft werken (als het alleen data fetch doet)

### **Wat Breekt:**
❌ Direct gebruik van oude calendar components (als die ergens anders gebruikt worden)  
❌ Custom calendar event handlers (moeten aangepast worden naar FullCalendar format)

### **Migration Path:**
```typescript
// Old component usage:
<WeekCalendar events={events} onEventClick={handleClick} />

// New component usage:
<FullCalendarView 
  userId={user.id}
  onEventEdit={(id) => handleClick({ id })}
/>
```

---

## 🎯 **DELIVERABLES**

### **Code:**
- [ ] Migration SQL: `20251003_calendar_events_table.sql`
- [ ] Component: `FullCalendarView.tsx`
- [ ] Component: `PlanningManagement.tsx`
- [ ] Component: `PlanningEventDialog.tsx`
- [ ] Hook: `useCalendarEvents.ts`
- [ ] CSS: `fullcalendar-simplex-theme.css`

### **Documentatie:**
- [ ] `FULLCALENDAR-SETUP.md` - Setup guide
- [ ] `PLANNING-USER-GUIDE.md` - User manual
- [ ] Update `README.md`

---

## 📅 **TIMELINE**

| Fase | Dagen | Status |
|------|-------|--------|
| Database Setup | 1 | ⏳ Pending |
| FullCalendar Install | 1 | ⏳ Pending |
| Hooks & Utilities | 1 | ⏳ Pending |
| UI Components | 2 | ⏳ Pending |
| Integration | 1 | ⏳ Pending |
| Cleanup | 1 | ⏳ Pending |
| Testing | 2 | ⏳ Pending |
| **TOTAAL** | **9 dagen** | |

---

## ✅ **ACCEPTATIE CRITERIA**

- [ ] FullCalendar rendert correct met Simplex theme
- [ ] Month/Week/Day views werken
- [ ] Events tonen correct (title, time, color)
- [ ] Drag & drop werkt voor events
- [ ] Event resize werkt
- [ ] Create event via date select werkt
- [ ] Edit event werkt
- [ ] Delete event werkt
- [ ] Sync met planning_items werkt (beide kanten)
- [ ] Admin kan alle gebruikers zien
- [ ] Monteur ziet alleen eigen calendar
- [ ] Mobile responsive
- [ ] Performance: < 500ms render time voor 100 events
- [ ] Andere CRM features werken nog

---

**VOLGENDE STAP:** Review beide plannen en dan beginnen met implementatie!

