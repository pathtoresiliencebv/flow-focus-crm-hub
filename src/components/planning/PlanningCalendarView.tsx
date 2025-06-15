
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WeekCalendar } from "../WeekCalendar";
import { MonthCalendar } from "../MonthCalendar";
import { CalendarIcon } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'appointment' | 'meeting' | 'other' | 'meditation';
  description?: string;
}

interface PlanningCalendarViewProps {
  calendarView: "week" | "month";
  onCalendarViewChange: (view: "week" | "month") => void;
  events: CalendarEvent[];
  onEventClick: (event: any) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventCreate: (date: Date, startHour: number, endHour: number) => void;
}

export const PlanningCalendarView = ({
  calendarView,
  onCalendarViewChange,
  events,
  onEventClick,
  onTimeSlotClick,
  onEventCreate,
}: PlanningCalendarViewProps) => {
  return (
    <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg sm:text-xl">
              {calendarView === "week" ? "Weekplanning" : "Maandplanning"}
            </CardTitle>
          </div>
          <Select value={calendarView} onValueChange={onCalendarViewChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Maand</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription className="text-gray-600 text-sm sm:text-base">
          Overzicht van alle geplande activiteiten
          <br />
          <span className="text-sm text-blue-600 font-medium">
            💡 Tip: Sleep over tijdslots om snel een nieuwe planning aan te maken
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calendarView === "week" ? (
          <WeekCalendar 
            events={events}
            onEventClick={onEventClick}
            onTimeSlotClick={onTimeSlotClick}
            onEventCreate={onEventCreate}
            showCurrentTimeLine={true}
          />
        ) : (
          <MonthCalendar 
            events={events}
            onEventClick={onEventClick}
            onEventCreate={onEventCreate}
          />
        )}
      </CardContent>
    </Card>
  );
};
