
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { WeekCalendar } from "./WeekCalendar";
import { useCrmStore, NewProject } from "@/hooks/useCrmStore";
import { useToast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { StatsGrid } from "./dashboard/StatsGrid";
import { UpcomingAppointments } from "./dashboard/UpcomingAppointments";

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
  const totalRevenue = projects.reduce((sum, project) => sum + (project.value || 0), 0);
  const completedProjects = projects.filter(p => p.status === "afgerond").length;

  // Get upcoming planning items (next 7 days)
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const upcomingPlanning = planningItems.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= today && itemDate <= nextWeek;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreateProject = (formData: FormData) => {
    const customerId = formData.get('customer') as string;
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) return;

    const newProject: NewProject = {
      title: formData.get('title') as string,
      customer_id: customer.id,
      date: (formData.get('date') as string) || null,
      value: Number(formData.get('value') as string) || null,
      status: "te-plannen",
      description: (formData.get('description') as string) || null,
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

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-4 sm:p-6 space-y-6">
        <DashboardHeader
          customers={customers}
          handleCreateProject={handleCreateProject}
          newProjectDialogOpen={newProjectDialogOpen}
          setNewProjectDialogOpen={setNewProjectDialogOpen}
        />

        <StatsGrid
          totalCustomers={totalCustomers}
          activeProjects={activeProjects}
          totalRevenue={totalRevenue}
          completedProjects={completedProjects}
        />

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

        <UpcomingAppointments planningItems={upcomingPlanning} />
      </div>
    </div>
  );
};
