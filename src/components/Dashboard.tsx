
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { SimplifiedPlanningManagement } from "./SimplifiedPlanningManagement";
import { useCrmStore, Customer, NewProject } from "@/hooks/useCrmStore";
import { usePlanningStore } from "@/hooks/usePlanningStore";
import { useToast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { StatsGrid } from "./dashboard/StatsGrid";
import { UpcomingAppointments } from "./dashboard/UpcomingAppointments";
import { InstallateurProjectCard } from "./dashboard/InstallateurProjectCard";
import { useAuth } from "@/contexts/AuthContext";

export const Dashboard = () => {
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const { customers, projects, addProject } = useCrmStore();
  const { planningItems, getCalendarEvents } = usePlanningStore();
  const { toast } = useToast();
  const { profile, user } = useAuth();

  // Filter projects based on user role
  const filteredProjects = profile?.role === 'Installateur' 
    ? projects.filter(p => p.assigned_user_id === user?.id)
    : projects;

  // Calculate statistics
  const totalCustomers = customers.length;
  const activeProjects = filteredProjects.filter(p => p.status !== "afgerond").length;
  const totalRevenue = profile?.role === 'Installateur' ? 0 : filteredProjects.reduce((sum, project) => sum + (project.value || 0), 0);
  const completedProjects = filteredProjects.filter(p => p.status === "afgerond").length;

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
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-x-hidden">
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
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
          userRole={profile?.role}
        />

        {/* Main Content Area - Mobile optimized */}
        <div className="space-y-4 sm:space-y-6">
        
        {profile?.role === 'Installateur' ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mx-1 sm:mx-0">
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <span className="text-base sm:text-xl">Mijn Projecten</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Overzicht van aan u toegewezen projecten
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Geen projecten toegewezen</h3>
                    <p className="text-sm">Er zijn momenteel geen projecten aan u toegewezen</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                      <InstallateurProjectCard
                        key={project.id}
                        project={project}
                        onProjectClick={(projectId) => window.location.href = `/projects/${projectId}`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Planning Management - Full Calendar */
            <SimplifiedPlanningManagement />
          )}
        </div>

        <UpcomingAppointments planningItems={upcomingPlanning} />
      </div>
    </div>
  );
};
