import React, { useState } from 'react';
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { TimeEntriesOverview } from './time-registration/TimeEntriesOverview';
import { TimeRegistrationForm } from './time-registration/TimeRegistrationForm';
import { SlidePanel } from '@/components/ui/slide-panel';

interface TimeRegistrationProps {
  showTimeDialog?: boolean;
  onCloseTimeDialog?: () => void;
}

export const TimeRegistration: React.FC<TimeRegistrationProps> = ({ 
  showTimeDialog = false, 
  onCloseTimeDialog 
}) => {
  const { setTitle } = usePageHeader();
  const [timePanelOpen, setTimePanelOpen] = useState(showTimeDialog);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedStartHour, setSelectedStartHour] = useState<number>(9);
  const [selectedEndHour, setSelectedEndHour] = useState<number>(10);

  // Sync with parent showTimeDialog prop
  React.useEffect(() => {
    setTimePanelOpen(showTimeDialog);
  }, [showTimeDialog]);

  React.useEffect(() => {
    setTitle("Tijdregistratie");
  }, [setTitle]);
  
  const handleSubmitTime = (e: React.FormEvent) => {
    e.preventDefault();
    setTimePanelOpen(false);
    onCloseTimeDialog?.();
  };

  const handlePanelClose = () => {
    setTimePanelOpen(false);
    onCloseTimeDialog?.();
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
      {/* Content - Always show overview, calendar removed per user request */}
      <div className="space-y-4">
        <TimeEntriesOverview />
      </div>
      
      <SlidePanel
        isOpen={timePanelOpen}
        onClose={handlePanelClose}
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
