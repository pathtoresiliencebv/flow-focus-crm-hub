import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar } from "lucide-react";
import { IconBox } from "@/components/ui/icon-box";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { TimeEntriesOverview } from './time-registration/TimeEntriesOverview';
import { TimeCalendarView } from './time-registration/TimeCalendarView';
import { QuickTimeRegistrationDialog } from './time-registration/QuickTimeRegistrationDialog';
import { TimeRegistrationForm } from './time-registration/TimeRegistrationForm';
import { SlidePanel } from '@/components/ui/slide-panel';

export const TimeRegistration = () => {
  const { setTitle } = usePageHeader();
  const [activeTab, setActiveTab] = useState("overview");
  const [timePanelOpen, setTimePanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedStartHour, setSelectedStartHour] = useState<number>(9);
  const [selectedEndHour, setSelectedEndHour] = useState<number>(10);
  const { toast } = useToast();

  React.useEffect(() => {
    setTitle("Tijdregistratie");
  }, [setTitle]);
  
  const handleSubmitTime = (e: React.FormEvent) => {
    e.preventDefault();
    setTimePanelOpen(false);
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
    setTimePanelOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Icon Boxes Navigation */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <IconBox
          icon={<Clock className="h-6 w-6" />}
          label="Overzicht"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <IconBox
          icon={<Calendar className="h-6 w-6" />}
          label="Maandkalender"
          active={activeTab === "calendar"}
          onClick={() => setActiveTab("calendar")}
        />
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <TimeEntriesOverview />
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-4">
          <TimeCalendarView 
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onEventCreate={handleEventCreate}
          />
        </div>
      )}
      
      <SlidePanel
        isOpen={timePanelOpen}
        onClose={() => setTimePanelOpen(false)}
        title="Nieuwe tijdsregistratie"
        size="lg"
      >
        <TimeRegistrationForm
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedStartHour={selectedStartHour}
          setSelectedStartHour={setSelectedStartHour}
          selectedEndHour={selectedEndHour}
          setSelectedEndHour={setSelectedEndHour}
          onSubmit={handleSubmitTime}
        />
      </SlidePanel>
    </div>
  );
};

export default TimeRegistration;
