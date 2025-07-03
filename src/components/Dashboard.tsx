
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { WeekCalendar } from "./WeekCalendar";
import { useCrmStore, Customer, NewProject } from "@/hooks/useCrmStore";
import { usePlanningStore } from "@/hooks/usePlanningStore";
import { useToast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { StatsGrid } from "./dashboard/StatsGrid";
import { UpcomingAppointments } from "./dashboard/UpcomingAppointments";

export const Dashboard = () => {
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const { customers, projects, addProject } = useCrmStore();
  const { planningItems, getCalendarEvents } = usePlanningStore();
  const { toast } = useToast();

  // Calculate statistics
  const totalCustomers = customers.length;
  const activeProjects = projects.filter(p => p.status !== "afgerond").length;
  const totalRevenue = projects.reduce((sum, project) => sum + (project.value || 0), 0);
  const completedProjects = projects.filter(p => p.status === "afgerond").length;

  // Get upcoming planning items (next 7 days) from database
  const today = new Date();
  const nextWeek = addDays(today, 7);
  const upcomingPlanning = planningItems
    .filter(item => {
      const itemDate = new Date(item.start_date);
      return itemDate >= today && itemDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .map(item => ({
      id: item.id,
      date: item.start_date,
      time: item.start_time,
      employee: 'Installateur', // We'll need to fetch this from user data
      employeeId: parseInt(item.assigned_user_id),
      project: item.title,
      projectId: item.project_id || '',
      location: item.location || '',
      description: item.description || '',
      status: item.status as "Gepland" | "Bevestigd" | "Afgerond" | "Geannuleerd",
      createdAt: item.created_at
    }));

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
        <div className="space-y-4 sm:space-y-6">
          {/* Calendar Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
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
                events={getCalendarEvents()}
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
