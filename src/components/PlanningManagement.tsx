
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/hooks/useUserStore";
import { useCrmStore } from "@/hooks/useCrmStore";
import { CalendarIcon, Clock, MapPin, User, Plus, CalendarDays, ChevronRight, Filter } from "lucide-react";
import LocationMapInput from "./LocationMapInput";
import { format, addDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { WeekCalendar } from "./WeekCalendar";
import { MonthCalendar } from "./MonthCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlanningItem {
  id: string;
  date: string;
  time: string;
  employee: string;
  employeeId: number;
  project: string;
  projectId: string;
  location: string;
  description: string;
  status: "Gepland" | "Bevestigd" | "Afgerond" | "Geannuleerd";
  createdAt: string;
}

// Generate time options from 6:00 to 22:00 in 15-minute intervals
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

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

  // Filter users with "Installateur" role
  const installers = users.filter(user => user.role === "Installateur");

  // Convert planning items to calendar events
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Gepland": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Bevestigd": return "bg-green-100 text-green-800 border-green-200";
      case "Afgerond": return "bg-gray-100 text-gray-800 border-gray-200";
      case "Geannuleerd": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get plannings for selected date
  const selectedDatePlannings = planningItems.filter(item => {
    if (!selectedDate) return false;
    const selectedDateFormatted = format(selectedDate, 'yyyy-MM-dd');
    return item.date === selectedDateFormatted;
  });

  // Get dates that have plannings for calendar highlighting
  const planningDates = planningItems.map(item => new Date(item.date));

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "Geen datum geselecteerd";
    return format(selectedDate, 'EEEE dd MMMM yyyy', { locale: nl });
  };

  const dayOptions = [
    { value: "1", label: "Maandag" },
    { value: "2", label: "Dinsdag" },
    { value: "3", label: "Woensdag" },
    { value: "4", label: "Donderdag" },
    { value: "5", label: "Vrijdag" },
    { value: "6", label: "Zaterdag" },
    { value: "0", label: "Zondag" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
        {/* Header Section - Now fully responsive */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Planning Beheer</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Beheer en plan alle activiteiten van je team</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Dialog open={multiDayPlanningDialogOpen} onOpenChange={setMultiDayPlanningDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Meerdaagse Planning
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Meerdaagse planning aanmaken</DialogTitle>
                  <DialogDescription>
                    Maak planning aan voor meerdere dagen met specifieke tijden en dagen van de week.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleCreateMultiDayPlanning(formData);
                }} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Startdatum</label>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        className="rounded-md border mt-1 pointer-events-auto"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Einddatum</label>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        className="rounded-md border mt-1 pointer-events-auto"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tijd</label>
                      <Select name="time" required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecteer tijd" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50 max-h-60">
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Monteur</label>
                      <Select name="employee" required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Kies monteur" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {installers.map((installer) => (
                            <SelectItem key={installer.id} value={installer.id.toString()}>
                              {installer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Project</label>
                    <Select name="project" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Kies project" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title} - {project.customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dagen van de week</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                      {dayOptions.map((day) => (
                        <label key={day.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="days"
                            value={day.value}
                            className="rounded"
                          />
                          <span className="text-sm">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Locatie</label>
                    <div className="mt-1">
                      <LocationMapInput
                        value={multiDayLocationValue}
                        onChange={setMultiDayLocationValue}
                        placeholder="Zoek adres of locatie..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beschrijving</label>
                    <Input name="description" className="mt-1" placeholder="Omschrijving van het werk" />
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setMultiDayPlanningDialogOpen(false);
                      setMultiDayLocationValue("");
                    }} className="w-full sm:w-auto">
                      Annuleren
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">Meerdaagse Planning Aanmaken</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={newPlanningDialogOpen} onOpenChange={setNewPlanningDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!selectedDate} className="bg-smans-primary hover:bg-smans-primary/90 text-white shadow-sm hover:shadow-md transition-all w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe Planning
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Nieuwe planning voor {formatSelectedDate()}</DialogTitle>
                  <DialogDescription>
                    Plan werk in voor een monteur op {formatSelectedDate()}.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleCreatePlanning(formData);
                }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Datum</label>
                      <Input 
                        type="text" 
                        value={formatSelectedDate()}
                        disabled 
                        className="mt-1 bg-gray-50" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Starttijd</label>
                      <Select name="time" required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecteer starttijd" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50 max-h-60">
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Monteur</label>
                    <Select name="employee" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Kies monteur" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {installers.map((installer) => (
                          <SelectItem key={installer.id} value={installer.id.toString()}>
                            {installer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Project</label>
                    <Select name="project" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Kies project" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title} - {project.customer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Locatie</label>
                    <div className="mt-1">
                      <LocationMapInput
                        value={locationValue}
                        onChange={setLocationValue}
                        placeholder="Zoek adres of locatie..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beschrijving</label>
                    <Input name="description" className="mt-1" placeholder="Omschrijving van het werk" />
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setNewPlanningDialogOpen(false);
                      setLocationValue("");
                    }} className="w-full sm:w-auto">
                      Annuleren
                    </Button>
                    <Button type="submit" className="bg-smans-primary hover:bg-smans-primary/90 text-white w-full sm:w-auto">Planning Aanmaken</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={quickPlanningDialogOpen} onOpenChange={setQuickPlanningDialogOpen}>
              <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Snelle planning aanmaken</DialogTitle>
                  <DialogDescription>
                    {quickPlanningData && 
                      `Planning voor ${format(quickPlanningData.date, 'EEEE dd MMMM yyyy', { locale: nl })} van ${quickPlanningData.startHour}:00 tot ${quickPlanningData.endHour}:00`
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleQuickPlanningCreate(formData);
                }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Monteur</label>
                      <Select name="employee" required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Kies monteur" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {installers.map((installer) => (
                            <SelectItem key={installer.id} value={installer.id.toString()}>
                              {installer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Project</label>
                      <Select name="project" required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Kies project" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.title} - {project.customer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Locatie</label>
                    <div className="mt-1">
                      <LocationMapInput
                        value={quickLocationValue}
                        onChange={setQuickLocationValue}
                        placeholder="Zoek adres of locatie..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Beschrijving</label>
                    <Input name="description" className="mt-1" placeholder="Omschrijving van het werk" />
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setQuickPlanningDialogOpen(false);
                      setQuickLocationValue("");
                      setQuickPlanningData(null);
                    }} className="w-full sm:w-auto">
                      Annuleren
                    </Button>
                    <Button type="submit" className="bg-smans-primary hover:bg-smans-primary/90 text-white w-full sm:w-auto">Planning Aanmaken</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs Navigation - Updated to only show calendar and list */}
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
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg sm:text-xl">
                      {calendarView === "week" ? "Weekplanning" : "Maandplanning"}
                    </CardTitle>
                  </div>
                  <Select value={calendarView} onValueChange={(value: "week" | "month") => setCalendarView(value)}>
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
                    events={calendarEvents}
                    onEventClick={handleEventClick}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventCreate={handleEventCreate}
                    showCurrentTimeLine={true}
                  />
                ) : (
                  <MonthCalendar 
                    events={calendarEvents}
                    onEventClick={handleEventClick}
                    onEventCreate={handleEventCreate}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4 sm:space-y-6 mt-6">
            {/* Enhanced All Planning Table - Made responsive */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Alle Planningen</CardTitle>
                    <CardDescription className="text-gray-600 text-sm sm:text-base">Overzicht van alle geplande activiteiten</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-xs sm:text-sm">Datum</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm">Tijd</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Monteur</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm">Project</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">Locatie</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm">Acties</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planningItems
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((item) => (
                        <TableRow key={item.id} className="hover:bg-blue-50 transition-colors">
                          <TableCell className="font-medium text-xs sm:text-sm">{format(new Date(item.date), 'dd MMM yyyy', { locale: nl })}</TableCell>
                          <TableCell className="font-mono text-xs sm:text-sm">{item.time}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{item.employee}</TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">{item.project}</TableCell>
                          <TableCell className="max-w-xs truncate hidden lg:table-cell text-xs sm:text-sm">{item.location}</TableCell>
                          <TableCell>
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="hover:bg-blue-100 text-xs sm:text-sm">
                              Bewerken
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default PlanningManagement;
