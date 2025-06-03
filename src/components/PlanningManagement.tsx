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
import { CalendarIcon, Clock, MapPin, User, Plus, CalendarDays } from "lucide-react";
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
      case "Gepland": return "bg-blue-100 text-blue-800";
      case "Bevestigd": return "bg-green-100 text-green-800";
      case "Afgerond": return "bg-gray-100 text-gray-800";
      case "Geannuleerd": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planning Beheer</h2>
        <div className="flex gap-2">
          <Dialog open={multiDayPlanningDialogOpen} onOpenChange={setMultiDayPlanningDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CalendarDays className="mr-2 h-4 w-4" />
                Meerdaagse Planning
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tijd</label>
                    <Input type="time" name="time" required className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Monteur</label>
                    <Select name="employee" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Kies monteur" />
                      </SelectTrigger>
                      <SelectContent>
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
                    <SelectContent>
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
                  <div className="grid grid-cols-4 gap-2 mt-1">
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setMultiDayPlanningDialogOpen(false);
                    setMultiDayLocationValue("");
                  }}>
                    Annuleren
                  </Button>
                  <Button type="submit">Meerdaagse Planning Aanmaken</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={newPlanningDialogOpen} onOpenChange={setNewPlanningDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedDate}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe Planning
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="text-sm font-medium">Tijd</label>
                    <Input type="time" name="time" required className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Monteur</label>
                  <Select name="employee" required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Kies monteur" />
                    </SelectTrigger>
                    <SelectContent>
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
                    <SelectContent>
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setNewPlanningDialogOpen(false);
                    setLocationValue("");
                  }}>
                    Annuleren
                  </Button>
                  <Button type="submit">Planning Aanmaken</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={quickPlanningDialogOpen} onOpenChange={setQuickPlanningDialogOpen}>
            <DialogContent className="max-w-2xl">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Monteur</label>
                    <Select name="employee" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Kies monteur" />
                      </SelectTrigger>
                      <SelectContent>
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
                      <SelectContent>
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
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setQuickPlanningDialogOpen(false);
                    setQuickLocationValue("");
                    setQuickPlanningData(null);
                  }}>
                    Annuleren
                  </Button>
                  <Button type="submit">Planning Aanmaken</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="week">Weekkalender</TabsTrigger>
          <TabsTrigger value="month">Maandoverzicht</TabsTrigger>
          <TabsTrigger value="list">Lijstweergave</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekplanning</CardTitle>
              <CardDescription>
                Overzicht van alle geplande activiteiten deze week
                <br />
                <span className="text-sm text-muted-foreground">
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

        <TabsContent value="month" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Kalender
                </CardTitle>
                <CardDescription>
                  Klik op een datum om planningen te bekijken
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      fontWeight: 'bold'
                    }
                  }}
                  className="rounded-md border pointer-events-auto"
                />
                <div className="mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Dagen met planning</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Date Planning */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Planning voor {formatSelectedDate()}
                </CardTitle>
                <CardDescription>
                  {selectedDatePlannings.length > 0 
                    ? `${selectedDatePlannings.length} activiteit(en) gepland`
                    : "Geen activiteiten gepland voor deze dag"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDatePlannings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Geen planning voor deze dag
                    </p>
                    {selectedDate && (
                      <Button 
                        onClick={() => setNewPlanningDialogOpen(true)}
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Planning Toevoegen
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDatePlannings.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-medium text-blue-600">{item.time}</div>
                          <div className="flex-1">
                            <div className="font-medium">{item.project}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.employee}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </div>
                            </div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {/* All Planning Table */}
          <Card>
            <CardHeader>
              <CardTitle>Alle Planningen</CardTitle>
              <CardDescription>Overzicht van alle geplande activiteiten</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Monteur</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Locatie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planningItems
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.date), 'dd MMM yyyy', { locale: nl })}</TableCell>
                      <TableCell>{item.time}</TableCell>
                      <TableCell>{item.employee}</TableCell>
                      <TableCell>{item.project}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.location}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Bewerken
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanningManagement;
