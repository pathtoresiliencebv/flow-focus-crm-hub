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
  const [activeTab, setActiveTab] = useState("week");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
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

        {/* Tabs Navigation - Made responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm shadow-sm">
            <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
              Weekkalender
            </TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
              Maandoverzicht
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">
              Lijstweergave
            </TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-6 mt-6">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  Weekplanning
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  Overzicht van alle geplande activiteiten deze week
                  <br />
                  <span className="text-sm text-blue-600 font-medium">
                    💡 Tip: Sleep over tijdslots om snel een nieuwe planning aan te maken
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeekCalendar 
                  events={calendarEvents}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventCreate={handleEventCreate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4 sm:space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Enhanced Interactive Calendar - Made more responsive */}
              <Card className="lg:col-span-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm order-2 lg:order-1">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Kalender
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    Klik op een datum om planningen te bekijken
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    modifiers={{
                      hasPlanning: planningDates
                    }}
                    modifiersStyles={{
                      hasPlanning: {
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: '8px'
                      }
                    }}
                    className="rounded-xl border-2 border-blue-100 pointer-events-auto bg-white shadow-sm w-full"
                  />
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-700 font-medium">Dagen met planning</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Selected Date Planning - Made fully responsive */}
              <Card className="lg:col-span-3 shadow-lg border-0 bg-white/80 backdrop-blur-sm order-1 lg:order-2">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                        <span className="truncate">Planning voor {formatSelectedDate()}</span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-1 text-sm">
                        {selectedDatePlannings.length > 0 
                          ? `${selectedDatePlannings.length} activiteit(en) gepland`
                          : "Geen activiteiten gepland voor deze dag"
                        }
                      </CardDescription>
                    </div>
                    {selectedDate && selectedDatePlannings.length === 0 && (
                      <Button 
                        onClick={() => setNewPlanningDialogOpen(true)}
                        className="bg-smans-primary hover:bg-smans-primary/90 text-white shadow-sm w-full sm:w-auto"
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Planning Toevoegen</span>
                        <span className="sm:hidden">Toevoegen</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDatePlannings.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-4 sm:mb-6 text-base sm:text-lg">
                        Geen planning voor deze dag
                      </p>
                      {selectedDate && (
                        <Button 
                          onClick={() => setNewPlanningDialogOpen(true)}
                          className="bg-smans-primary hover:bg-smans-primary/90 text-white shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Eerste Planning Toevoegen
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDatePlannings.map((item) => (
                        <div key={item.id} className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-3 sm:p-5 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 flex-1 min-w-0">
                              <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-bold text-sm w-fit">
                                {item.time}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-base sm:text-lg mb-2">{item.project}</div>
                                <div className="grid grid-cols-1 gap-2 sm:gap-3 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <span className="font-medium">{item.employee}</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="break-words">{item.location}</span>
                                  </div>
                                </div>
                                {item.description && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border-l-4 border-blue-300">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity sm:ml-4">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {selectedDate && (
                        <div className="pt-4 border-t border-gray-200">
                          <Button 
                            onClick={() => setNewPlanningDialogOpen(true)}
                            variant="outline"
                            className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 py-3"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Nog een planning toevoegen
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
    </div>
  );
};

export default PlanningManagement;
