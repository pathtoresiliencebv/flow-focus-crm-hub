
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/hooks/useUserStore";
import { useCrmStore } from "@/hooks/useCrmStore";
import { format, addDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanningItem } from './planning/types';
import { PlanningHeader } from './planning/PlanningHeader';
import { MultiDayPlanningDialog } from './planning/MultiDayPlanningDialog';
import { NewPlanningDialog } from './planning/NewPlanningDialog';
import { QuickPlanningDialog } from './planning/QuickPlanningDialog';
import { PlanningCalendarView } from './planning/PlanningCalendarView';
import { PlanningListView } from './planning/PlanningListView';

export const PlanningManagement = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newPlanningDialogOpen, setNewPlanningDialogOpen] = useState(false);
  const [quickPlanningDialogOpen, setQuickPlanningDialogOpen] = useState(false);
  const [multiDayPlanningDialogOpen, setMultiDayPlanningDialogOpen] = useState(false);
  const [locationValue, setLocationValue] = useState("");
  const [quickLocationValue, setQuickLocationValue] = useState("");
  const [multiDayLocationValue, setMultiDayLocationValue] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [activeTab, setActiveTab] = useState("calendar");
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");
  const [quickPlanningData, setQuickPlanningData] = useState<{
    date: Date;
    startHour: number;
    endHour: number;
  } | null>(null);
  
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([
    {
      id: "1",
      date: "2025-06-02",
      time: "09:00",
      employee: "Peter Bakker",
      employeeId: 3,
      project: "Kozijnen vervangen",
      projectId: "1",
      location: "Hoofdstraat 123, Amsterdam, Nederland",
      description: "Installatie nieuwe kozijnen woonkamer",
      status: "Gepland",
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      date: "2025-06-04",
      time: "13:30",
      employee: "Peter Bakker",
      employeeId: 3,
      project: "Nieuwe ramen installeren",
      projectId: "2",
      location: "Kerkstraat 45, Utrecht, Nederland",
      description: "Opmeting en adviesgesprek",
      status: "Bevestigd",
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      date: "2025-06-06",
      time: "10:00",
      employee: "Peter Bakker",
      employeeId: 3,
      project: "Kozijnen vervangen",
      projectId: "1",
      location: "Marktplein 12, Rotterdam, Nederland",
      description: "Eindcontrole en oplevering",
      status: "Gepland",
      createdAt: new Date().toISOString()
    }
  ]);

  const { toast } = useToast();
  const { users } = useUserStore();
  const { projects } = useCrmStore();

  const installers = users.filter(user => user.role === "Installateur");

  const calendarEvents = planningItems.map(item => ({
    id: item.id,
    title: `${item.project} - ${item.employee}`,
    startTime: item.time,
    endTime: format(addDays(parseISO(`${item.date}T${item.time}`), 0), 'HH:mm'),
    date: item.date,
    type: 'appointment' as const,
    description: item.description
  }));

  const handleCreatePlanning = (formData: FormData) => {
    const selectedDateFormatted = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];
    const newPlanning: PlanningItem = {
      id: Date.now().toString(),
      date: selectedDateFormatted,
      time: formData.get('time') as string,
      employee: users.find(u => u.id === parseInt(formData.get('employee') as string))?.name || '',
      employeeId: parseInt(formData.get('employee') as string),
      project: projects.find(p => p.id === formData.get('project') as string)?.title || '',
      projectId: formData.get('project') as string,
      location: locationValue,
      description: formData.get('description') as string,
      status: "Gepland",
      createdAt: new Date().toISOString()
    };

    setPlanningItems([...planningItems, newPlanning]);
    setNewPlanningDialogOpen(false);
    setLocationValue("");
    
    toast({
      title: "Planning aangemaakt",
      description: `Planning voor ${newPlanning.employee} op ${format(selectedDate || new Date(), 'dd MMMM yyyy', { locale: nl })} is succesvol aangemaakt.`,
    });
  };

  const handleCreateMultiDayPlanning = (formData: FormData) => {
    if (!startDate || !endDate) {
      toast({
        title: "Fout",
        description: "Selecteer een start- en einddatum.",
        variant: "destructive"
      });
      return;
    }

    const selectedEmployee = users.find(u => u.id === parseInt(formData.get('employee') as string));
    const selectedProject = projects.find(p => p.id === formData.get('project') as string);
    const time = formData.get('time') as string;
    const description = formData.get('description') as string;
    const selectedDays = formData.getAll('days') as string[];

    if (selectedDays.length === 0) {
      toast({
        title: "Fout",
        description: "Selecteer minimaal één dag van de week.",
        variant: "destructive"
      });
      return;
    }

    const newPlannings: PlanningItem[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay().toString();
      
      if (selectedDays.includes(dayOfWeek)) {
        const newPlanning: PlanningItem = {
          id: `${Date.now()}-${currentDate.getTime()}`,
          date: format(currentDate, 'yyyy-MM-dd'),
          time: time,
          employee: selectedEmployee?.name || '',
          employeeId: selectedEmployee?.id || 0,
          project: selectedProject?.title || '',
          projectId: selectedProject?.id || '',
          location: multiDayLocationValue,
          description: description,
          status: "Gepland",
          createdAt: new Date().toISOString()
        };
        newPlannings.push(newPlanning);
      }
      
      currentDate = addDays(currentDate, 1);
    }

    setPlanningItems([...planningItems, ...newPlannings]);
    setMultiDayPlanningDialogOpen(false);
    setMultiDayLocationValue("");
    setStartDate(new Date());
    setEndDate(addDays(new Date(), 7));
    
    toast({
      title: "Meerdaagse planning aangemaakt",
      description: `${newPlannings.length} planning(en) succesvol aangemaakt voor ${selectedEmployee?.name}.`,
    });
  };

  const handleEventClick = (event: any) => {
    console.log("Planning event clicked:", event);
    toast({
      title: "Planning details",
      description: `${event.title} - ${event.startTime}`,
    });
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedDate(date);
    setNewPlanningDialogOpen(true);
  };

  const handleEventCreate = (date: Date, startHour: number, endHour: number) => {
    setQuickPlanningData({ date, startHour, endHour });
    setQuickPlanningDialogOpen(true);
  };

  const handleQuickPlanningCreate = (formData: FormData) => {
    if (!quickPlanningData) return;

    const newPlanning: PlanningItem = {
      id: Date.now().toString(),
      date: format(quickPlanningData.date, 'yyyy-MM-dd'),
      time: `${quickPlanningData.startHour.toString().padStart(2, '0')}:00`,
      employee: users.find(u => u.id === parseInt(formData.get('employee') as string))?.name || '',
      employeeId: parseInt(formData.get('employee') as string),
      project: projects.find(p => p.id === formData.get('project') as string)?.title || '',
      projectId: formData.get('project') as string,
      location: quickLocationValue,
      description: formData.get('description') as string,
      status: "Gepland",
      createdAt: new Date().toISOString()
    };

    setPlanningItems([...planningItems, newPlanning]);
    setQuickPlanningDialogOpen(false);
    setQuickLocationValue("");
    setQuickPlanningData(null);
    
    toast({
      title: "Planning aangemaakt",
      description: `Planning voor ${newPlanning.employee} op ${format(quickPlanningData.date, 'dd MMMM yyyy', { locale: nl })} van ${quickPlanningData.startHour}:00 tot ${quickPlanningData.endHour}:00 is succesvol aangemaakt.`,
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PlanningHeader 
        onMultiDayClick={() => setMultiDayPlanningDialogOpen(true)}
        onNewPlanningClick={() => setNewPlanningDialogOpen(true)}
        selectedDate={selectedDate}
      />
      
      <MultiDayPlanningDialog
        open={multiDayPlanningDialogOpen}
        onOpenChange={setMultiDayPlanningDialogOpen}
        onSubmit={handleCreateMultiDayPlanning}
        installers={installers}
        projects={projects}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        location={multiDayLocationValue}
        onLocationChange={setMultiDayLocationValue}
      />

      <NewPlanningDialog
        open={newPlanningDialogOpen}
        onOpenChange={setNewPlanningDialogOpen}
        onSubmit={handleCreatePlanning}
        installers={installers}
        projects={projects}
        selectedDate={selectedDate}
        location={locationValue}
        onLocationChange={setLocationValue}
      />

      <QuickPlanningDialog
        open={quickPlanningDialogOpen}
        onOpenChange={setQuickPlanningDialogOpen}
        onSubmit={handleQuickPlanningCreate}
        installers={installers}
        projects={projects}
        quickPlanningData={quickPlanningData}
        location={quickLocationValue}
        onLocationChange={setQuickLocationValue}
        onClose={() => {
          setQuickPlanningDialogOpen(false);
          setQuickLocationValue("");
          setQuickPlanningData(null);
        }}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm shadow-sm">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
            Kalender
          </TabsTrigger>
          <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
            Lijstweergave
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6 mt-6">
          <PlanningCalendarView
            calendarView={calendarView}
            onCalendarViewChange={(value: "week" | "month") => setCalendarView(value)}
            events={calendarEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onEventCreate={handleEventCreate}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4 sm:space-y-6 mt-6">
          <PlanningListView planningItems={planningItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanningManagement;
