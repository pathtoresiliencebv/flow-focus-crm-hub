import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Users, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { WeekCalendar } from "./WeekCalendar";

interface DashboardEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'meditation' | 'appointment' | 'meeting' | 'other';
  description?: string;
}

export const Dashboard = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<DashboardEvent[]>([
    {
      id: "1",
      title: "Team vergadering",
      startTime: "09:00",
      endTime: "10:00",
      date: "2025-06-12",
      type: "meeting",
      description: "Wekelijkse team sync"
    },
    {
      id: "2", 
      title: "Klant gesprek",
      startTime: "14:00",
      endTime: "15:30",
      date: "2025-06-13",
      type: "appointment",
      description: "Overleg nieuwe kozijnen"
    }
  ]);

  const handleEventClick = (event: DashboardEvent) => {
    toast({
      title: "Planning Details",
      description: `${event.title} - ${event.startTime} tot ${event.endTime}`,
    });
  };

  const handlePlanningAdded = (planning: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => {
    const newEvent: DashboardEvent = {
      id: Date.now().toString(),
      title: planning.title,
      startTime: planning.startTime,
      endTime: planning.endTime,
      date: planning.date,
      type: 'appointment',
      description: planning.description
    };

    setEvents(prev => [...prev, newEvent]);

    toast({
      title: "Planning toegevoegd",
      description: `${planning.title} is toegevoegd voor ${planning.date}`,
    });
  };

  const stats = [
    {
      title: "Actieve Projecten",
      value: "12",
      description: "3 nieuwe deze week",
      icon: FileText,
      color: "bg-blue-500"
    },
    {
      title: "Team Leden",
      value: "8",
      description: "2 installateurs beschikbaar",
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Deze Week",
      value: "€15.420",
      description: "+12% t.o.v. vorige week",
      icon: TrendingUp,
      color: "bg-purple-500"
    },
    {
      title: "Vandaag",
      value: "6",
      description: "4 voltooid, 2 gepland",
      icon: CalendarDays,
      color: "bg-orange-500"
    }
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: "Offerte opstellen - Nieuwe kozijnen",
      dueDate: "Vandaag",
      priority: "Hoog",
      status: "pending"
    },
    {
      id: 2,
      title: "Materiaal bestellen - Project Amsterdam",
      dueDate: "Morgen",
      priority: "Gemiddeld",
      status: "pending"
    },
    {
      id: 3,
      title: "Klant terugbellen - Reparatie",
      dueDate: "Vandaag",
      priority: "Hoog",
      status: "completed"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welkom terug! Hier is je overzicht voor vandaag.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
              <FileText className="mr-2 h-4 w-4" />
              Rapport
            </Button>
            <Button className="bg-smans-primary hover:bg-smans-primary/90 text-white shadow-sm hover:shadow-md transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Nieuw Project
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-lg border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Calendar - Takes 2 columns on XL screens */}
          <div className="xl:col-span-2">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  Deze Week Planning
                </CardTitle>
                <CardDescription>
                  Klik op een tijdslot of sleep om een nieuwe planning toe te voegen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeekCalendar 
                  events={events}
                  onEventClick={handleEventClick}
                  onPlanningAdded={handlePlanningAdded}
                />
              </CardContent>
            </Card>
          </div>

          {/* Tasks Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Snelle Acties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                  <Plus className="mr-2 h-4 w-4" />
                  Nieuwe Offerte
                </Button>
                <Button className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                  <Users className="mr-2 h-4 w-4" />
                  Klant Toevoegen
                </Button>
                <Button className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200">
                  <Clock className="mr-2 h-4 w-4" />
                  Tijd Registreren
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Aankomende Taken</CardTitle>
                <CardDescription>Belangrijke deadlines en to-dos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="mt-1">
                        {task.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className={`h-4 w-4 ${task.priority === 'Hoog' ? 'text-red-500' : 'text-orange-500'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{task.dueDate}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'Hoog' ? 'bg-red-100 text-red-700' :
                            task.priority === 'Gemiddeld' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
