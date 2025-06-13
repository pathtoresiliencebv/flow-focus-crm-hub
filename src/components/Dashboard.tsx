
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, FileText, Euro, Plus, TrendingUp, Clock, MapPin, User } from "lucide-react";
import { WeekCalendar } from "./WeekCalendar";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useUserStore } from "@/hooks/useUserStore";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

// Real planning interface to match PlanningManagement
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

export const Dashboard = () => {
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const { customers, projects, addProject } = useCrmStore();
  const { users } = useUserStore();
  const { toast } = useToast();

  // Real planning data that matches the PlanningManagement component
  const [planningItems] = useState<PlanningItem[]>([
    {
      id: "1",
      date: "2025-06-16", // This week
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
      date: "2025-06-17", // This week
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
      date: "2025-06-18", // This week
      time: "10:00",
      employee: "Peter Bakker",
      employeeId: 3,
      project: "Kozijnen vervangen",
      projectId: "1",
      location: "Marktplein 12, Rotterdam, Nederland",
      description: "Eindcontrole en oplevering",
      status: "Gepland",
      createdAt: new Date().toISOString()
    },
    {
      id: "4",
      date: "2025-06-19", // This week
      time: "14:00",
      employee: "Peter Bakker",
      employeeId: 3,
      project: "Nieuwe ramen installeren",
      projectId: "2",
      location: "Parkstraat 88, Den Haag, Nederland",
      description: "Installatie aluminium ramen",
      status: "Gepland",
      createdAt: new Date().toISOString()
    }
  ]);

  // Convert real planning items to calendar events with proper end times
  const calendarEvents = planningItems.map(item => {
    const startTime = item.time;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    // Assume 2-hour duration for each appointment
    const endHour = startHour + 2;
    const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    
    return {
      id: item.id,
      title: `${item.project} - ${item.employee}`,
      startTime: startTime,
      endTime: endTime,
      date: item.date,
      type: 'appointment' as const,
      description: `${item.description} - ${item.location}`
    };
  });

  // Calculate statistics
  const totalCustomers = customers.length;
  const activeProjects = projects.filter(p => p.status !== "afgerond").length;
  const totalRevenue = projects.reduce((sum, project) => sum + parseFloat(project.value), 0);
  const completedProjects = projects.filter(p => p.status === "afgerond").length;

  // Get upcoming planning items (next 7 days)
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const upcomingPlanning = planningItems.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= today && itemDate <= nextWeek;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreateProject = (formData: FormData) => {
    const customerId = parseInt(formData.get('customer') as string);
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) return;

    const newProject = {
      title: formData.get('title') as string,
      customer: customer.name,
      customerId: customerId,
      date: formData.get('date') as string,
      value: formData.get('value') as string,
      status: "te-plannen" as const,
      description: formData.get('description') as string
    };

    addProject(newProject);
    setNewProjectDialogOpen(false);
    
    toast({
      title: "Project aangemaakt",
      description: `${newProject.title} is succesvol aangemaakt.`,
    });
  };

  const handleEventClick = (event: any) => {
    toast({
      title: "Planning details",
      description: `${event.title} - ${event.startTime}`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Welkom terug! Hier is een overzicht van je bedrijf.</p>
          </div>
          <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-smans-primary hover:bg-smans-primary/90 text-white shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nieuw Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Nieuw project aanmaken</DialogTitle>
                <DialogDescription>
                  Maak een nieuw project aan voor een klant.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateProject(formData);
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Projectnaam</label>
                  <Input name="title" className="mt-1" placeholder="Bijv. Kozijnen vervangen" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Klant</label>
                  <Select name="customer" required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Kies een klant" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Geplande datum</label>
                    <Input name="date" type="date" className="mt-1" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Waarde (€)</label>
                    <Input name="value" type="number" className="mt-1" placeholder="0" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Beschrijving</label>
                  <Input name="description" className="mt-1" placeholder="Omschrijving van het project" />
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setNewProjectDialogOpen(false)} className="w-full sm:w-auto">
                    Annuleren
                  </Button>
                  <Button type="submit" className="bg-smans-primary hover:bg-smans-primary/90 text-white w-full sm:w-auto">
                    Project Aanmaken
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Totaal Klanten</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalCustomers}</div>
              <p className="text-xs text-green-600 font-medium">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Actief
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Actieve Projecten</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{activeProjects}</div>
              <p className="text-xs text-blue-600 font-medium">
                In behandeling
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Totale Omzet</CardTitle>
              <Euro className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">€{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-purple-600 font-medium">
                Dit jaar
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Afgeronde Projecten</CardTitle>
              <CalendarDays className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{completedProjects}</div>
              <p className="text-xs text-orange-600 font-medium">
                Succesvol
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Full Width Calendar */}
          <Card className="xl:col-span-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Weekplanning
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                Overzicht van alle geplande activiteiten deze week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeekCalendar 
                events={calendarEvents}
                onEventClick={handleEventClick}
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions as floating element on mobile, below calendar on desktop */}
        <div className="xl:hidden">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Komende Afspraken
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                {upcomingPlanning.length} afspraak/afspraken de komende week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPlanning.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Geen afspraken gepland</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingPlanning.slice(0, 4).map((item) => (
                    <div key={item.id} className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                          {format(new Date(item.date), 'dd MMM', { locale: nl })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 mb-1">{item.project}</div>
                          <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-blue-500" />
                              <span>{item.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-green-500" />
                              <span>{item.employee}</span>
                            </div>
                            <div className="flex items-start gap-1">
                              <MapPin className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span className="break-words text-xs">{item.location}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
