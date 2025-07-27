import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeEntriesOverview } from './time-registration/TimeEntriesOverview';
import { TimeCalendarView } from './time-registration/TimeCalendarView';
import { TimeRegistrationForm } from './time-registration/TimeRegistrationForm';
import { TimeReportsView } from './time-registration/TimeReportsView';
import { QuickTimeRegistrationDialog } from './time-registration/QuickTimeRegistrationDialog';

export const TimeRegistration = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedStartHour, setSelectedStartHour] = useState<number>(9);
  const [selectedEndHour, setSelectedEndHour] = useState<number>(10);
  const { toast } = useToast();
  
  const handleSubmitTime = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeDialogOpen(false);
  };

  const handleEventClick = (event: any) => {
    console.log("Event clicked:", event);
    toast({
      title: "Event details",
      description: `${event.title} - ${event.startTime} tot ${event.endTime}`,
    });
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    console.log("Time slot clicked:", date, hour);
    setSelectedDate(date);
    setSelectedStartHour(hour);
    setSelectedEndHour(hour + 1);
    setActiveTab("register");
  };

  const handleEventCreate = (date: Date, startHour: number, endHour: number) => {
    console.log("Creating event:", date, startHour, endHour);
    setSelectedDate(date);
    setSelectedStartHour(startHour);
    setSelectedEndHour(endHour);
    setTimeDialogOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tijdsregistratie</h2>
        <Button onClick={() => setActiveTab("register")}>Nieuwe registratie</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full sm:w-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overzicht</TabsTrigger>
          <TabsTrigger value="calendar" className="text-xs sm:text-sm">Weekkalender</TabsTrigger>
          <TabsTrigger value="register" className="text-xs sm:text-sm">Registreren</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm">Rapporten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <TimeEntriesOverview />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <TimeCalendarView 
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onEventCreate={handleEventCreate}
          />
        </TabsContent>

        <TabsContent value="register" className="space-y-4">
          <TimeRegistrationForm
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedStartHour={selectedStartHour}
            setSelectedStartHour={setSelectedStartHour}
            selectedEndHour={selectedEndHour}
            setSelectedEndHour={setSelectedEndHour}
            onSubmit={handleSubmitTime}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <TimeReportsView />
        </TabsContent>
      </Tabs>
      
      <QuickTimeRegistrationDialog
        open={timeDialogOpen}
        onOpenChange={setTimeDialogOpen}
        onSubmit={handleSubmitTime}
        selectedDate={selectedDate}
        selectedStartHour={selectedStartHour}
        selectedEndHour={selectedEndHour}
      />
    </div>
  );
};

export default TimeRegistration;
