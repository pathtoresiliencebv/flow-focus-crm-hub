
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/hooks/useUserStore";
import { useCrmStore } from "@/hooks/useCrmStore";
import { usePlanningStore } from "@/hooks/usePlanningStore";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  
  const { toast } = useToast();
  const { users } = useUserStore();
  const { projects } = useCrmStore();
  const { user } = useAuth();
  const { 
    planningItems, 
    loading, 
    addPlanningItem, 
    getCalendarEvents 
  } = usePlanningStore();

  const installers = users.filter(user => user.role === "Installateur");

  const handleCreatePlanning = async (formData: FormData) => {
    if (!user) return;
    
    const selectedDateFormatted = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];
    
    const newPlanning = {
      assigned_user_id: formData.get('employee') as string,
      project_id: formData.get('project') as string,
      title: projects.find(p => p.id === formData.get('project') as string)?.title || 'Planning',
      description: formData.get('description') as string,
      start_date: selectedDateFormatted,
      start_time: formData.get('time') as string,
      end_time: format(addDays(new Date(`2000-01-01T${formData.get('time') as string}`), 0), 'HH:mm'),
      location: locationValue,
      status: "Gepland"
    };

    const result = await addPlanningItem(newPlanning);
    if (result) {
      setNewPlanningDialogOpen(false);
      setLocationValue("");
    }
  };

  const handleCreateMultiDayPlanning = async (formData: FormData) => {
    if (!startDate || !endDate || !user) {
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

    let currentDate = new Date(startDate);
    let successCount = 0;

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay().toString();
      
      if (selectedDays.includes(dayOfWeek)) {
        const planningData = {
          assigned_user_id: selectedEmployee?.id.toString() || '',
          project_id: selectedProject?.id || '',
          title: selectedProject?.title || 'Planning',
          description: description,
          start_date: format(currentDate, 'yyyy-MM-dd'),
          start_time: time,
          end_time: format(addDays(new Date(`2000-01-01T${time}`), 0), 'HH:mm'),
          location: multiDayLocationValue,
          status: "Gepland"
        };
        
        const result = await addPlanningItem(planningData);
        if (result) successCount++;
      }
      
      currentDate = addDays(currentDate, 1);
    }

    if (successCount > 0) {
      setMultiDayPlanningDialogOpen(false);
      setMultiDayLocationValue("");
      setStartDate(new Date());
      setEndDate(addDays(new Date(), 7));
      
      toast({
        title: "Meerdaagse planning aangemaakt",
        description: `${successCount} planning(en) succesvol aangemaakt.`,
      });
    }
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

  const handleQuickPlanningCreate = async (formData: FormData) => {
    if (!quickPlanningData || !user) return;

    const planningData = {
      assigned_user_id: formData.get('employee') as string,
      project_id: formData.get('project') as string,
      title: projects.find(p => p.id === formData.get('project') as string)?.title || 'Planning',
      description: formData.get('description') as string,
      start_date: format(quickPlanningData.date, 'yyyy-MM-dd'),
      start_time: `${quickPlanningData.startHour.toString().padStart(2, '0')}:00`,
      end_time: `${quickPlanningData.endHour.toString().padStart(2, '0')}:00`,
      location: quickLocationValue,
      status: "Gepland"
    };

    const result = await addPlanningItem(planningData);
    if (result) {
      setQuickPlanningDialogOpen(false);
      setQuickLocationValue("");
      setQuickPlanningData(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-smans-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Planning laden...</p>
        </div>
      </div>
    );
  }

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
            events={getCalendarEvents()}
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
