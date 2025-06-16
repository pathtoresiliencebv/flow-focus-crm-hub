
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeekCalendar } from "@/components/WeekCalendar";
import { usePlanningStore } from "@/hooks/usePlanningStore";

interface TimeCalendarViewProps {
  onEventClick: (event: any) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  onEventCreate: (date: Date, startHour: number, endHour: number) => void;
}

export const TimeCalendarView = ({ onEventClick, onTimeSlotClick, onEventCreate }: TimeCalendarViewProps) => {
  const { getCalendarEvents } = usePlanningStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekkalender</CardTitle>
        <CardDescription>
          Bekijk en beheer je tijdsregistraties in weekoverzicht.
          <br />
          <span className="text-sm text-muted-foreground">
            💡 Tip: Sleep over tijdslots om snel een nieuwe registratie aan te maken
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WeekCalendar
          events={getCalendarEvents()}
          onEventClick={onEventClick}
          onTimeSlotClick={onTimeSlotClick}
          onEventCreate={onEventCreate}
        />
      </CardContent>
    </Card>
  );
};
