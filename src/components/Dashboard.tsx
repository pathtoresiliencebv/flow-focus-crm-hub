
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { useCrmStore } from "@/hooks/useCrmStore";
import { Calendar, Clock, MapPin, User, Folder, Eye } from "lucide-react";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WeekCalendar } from "@/components/WeekCalendar";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Mock planning data (in a real app, this would come from your planning store)
const mockPlanningItems = [
  {
    id: "1",
    date: "2025-06-12",
    time: "09:00",
    employee: "Peter Bakker",
    project: "Kozijnen vervangen",
    location: "Hoofdstraat 123, Amsterdam",
    status: "Gepland"
  },
  {
    id: "2",
    date: "2025-06-12",
    time: "14:00",
    employee: "Peter Bakker",
    project: "Nieuwe ramen installeren",
    location: "Kerkstraat 45, Utrecht",
    status: "Bevestigd"
  },
  {
    id: "3",
    date: "2025-06-13",
    time: "10:00",
    employee: "Peter Bakker",
    project: "Kozijnen vervangen",
    location: "Marktplein 12, Rotterdam",
    status: "Gepland"
  },
  {
    id: "4",
    date: "2025-06-13",
    time: "15:30",
    employee: "Peter Bakker",
    project: "Onderhoud kozijnen",
    location: "Dorpsstraat 89, Haarlem",
    status: "Gepland"
  },
  {
    id: "5",
    date: "2025-06-14",
    time: "11:00",
    employee: "Peter Bakker",
    project: "Nieuwe ramen installeren",
    location: "Parkstraat 67, Den Haag",
    status: "Gepland"
  }
];

// Convert mock planning items to calendar events
const mockCalendarEvents = mockPlanningItems.map(item => ({
  id: item.id,
  title: `${item.project} - ${item.employee}`,
  startTime: item.time,
  endTime: format(new Date(`2000-01-01 ${item.time}`).getTime() + 2 * 60 * 60 * 1000, 'HH:mm'), // Add 2 hours
  date: item.date,
  type: 'appointment' as const,
  description: `${item.project} bij ${item.location}`
}));

export const Dashboard = () => {
  const { customers, projects } = useCrmStore();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Calculate real statistics
  const totalCustomers = customers.length;
  const activeProjects = projects.filter(p => p.status !== "afgerond").length;
  const totalRevenue = projects
    .filter(p => p.status === "afgerond")
    .reduce((sum, p) => sum + parseFloat(p.value || "0"), 0);
  const plannedProjects = projects.filter(p => p.status === "gepland").length;

  const statusCounts = {
    "te-plannen": projects.filter(p => p.status === "te-plannen").length,
    "gepland": projects.filter(p => p.status === "gepland").length,
    "herkeuring": projects.filter(p => p.status === "herkeuring").length,
    "afgerond": projects.filter(p => p.status === "afgerond").length,
  };

  const kozijnenData = [
    { name: "Te plannen", waarde: statusCounts["te-plannen"] },
    { name: "Gepland", waarde: statusCounts["gepland"] },
    { name: "Herkeuring", waarde: statusCounts["herkeuring"] },
    { name: "Afgerond", waarde: statusCounts["afgerond"] },
  ];

  // Get today's and tomorrow's planning
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  const todayPlannings = mockPlanningItems.filter(item => {
    const itemDate = new Date(item.date);
    return isToday(itemDate);
  });

  const tomorrowPlannings = mockPlanningItems.filter(item => {
    const itemDate = new Date(item.date);
    return isTomorrow(itemDate);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Gepland": return "bg-blue-100 text-blue-800";
      case "Bevestigd": return "bg-green-100 text-green-800";
      case "Afgerond": return "bg-gray-100 text-gray-800";
      case "Geannuleerd": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case "te-plannen": return "bg-yellow-100 text-yellow-800";
      case "gepend": return "bg-blue-100 text-blue-800";
      case "herkeuring": return "bg-orange-100 text-orange-800";
      case "afgerond": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "te-plannen": return "Te plannen";
      case "gepland": return "Gepland";
      case "herkeuring": return "Herkeuring";
      case "afgerond": return "Afgerond";
      default: return status;
    }
  };

  // Recent activities based on real data
  const recentActivities = [
    ...customers.slice(-2).map(customer => ({
      description: `Nieuwe klant geregistreerd: ${customer.name}`,
      timestamp: new Date(customer.createdAt).toLocaleDateString('nl-NL'),
      color: "bg-red-600"
    })),
    ...projects.slice(-3).map(project => ({
      description: `Project "${project.title}" aangemaakt voor ${project.customer}`,
      timestamp: new Date(project.createdAt).toLocaleDateString('nl-NL'),
      color: project.status === "afgerond" ? "bg-green-500" : "bg-red-600"
    }))
  ].slice(0, 5);

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
    const planningItem = mockPlanningItems.find(item => item.id === event.id);
    if (planningItem) {
      toast({
        title: "Planning Details",
        description: `${planningItem.project} - ${planningItem.employee} om ${planningItem.time} bij ${planningItem.location}`,
      });
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    console.log('Time slot clicked:', date, hour);
    toast({
      title: "Nieuwe Planning",
      description: `Klik hier om een nieuwe planning aan te maken voor ${format(date, 'dd MMMM yyyy', { locale: nl })} om ${hour}:00`,
    });
  };

  const handleEventCreate = (date: Date, startHour: number, endHour: number) => {
    console.log('Create event:', date, startHour, endHour);
    toast({
      title: "Planning Aanmaken",
      description: `Nieuwe planning aanmaken voor ${format(date, 'dd MMMM yyyy', { locale: nl })} van ${startHour}:00 tot ${endHour}:00`,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Klanten</CardDescription>
            <CardTitle className="text-3xl">{totalCustomers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600 font-semibold">Actieve klanten</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actieve Projecten</CardDescription>
            <CardTitle className="text-3xl">{activeProjects}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-yellow-600 font-semibold">In behandeling</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Omzet</CardDescription>
            <CardTitle className="text-3xl">€{totalRevenue.toLocaleString('nl-NL')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600 font-semibold">Afgeronde projecten</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Geplande Projecten</CardDescription>
            <CardTitle className="text-3xl">{plannedProjects}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-red-600 font-semibold">Deze maand</p>
          </CardContent>
        </Card>
      </div>

      {/* Week Calendar Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-smans-primary" />
            Weekoverzicht Planning
          </CardTitle>
          <CardDescription>
            Overzicht van alle afspraken en planning voor de gehele week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeekCalendar 
            events={mockCalendarEvents}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            onEventCreate={handleEventCreate}
          />
        </CardContent>
      </Card>

      {/* Planning Agenda and Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Planning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-smans-primary" />
              Vandaag - {format(today, 'EEEE dd MMMM', { locale: nl })}
            </CardTitle>
            <CardDescription>
              {todayPlannings.length > 0 
                ? `${todayPlannings.length} afspraak${todayPlannings.length > 1 ? 'en' : ''} gepland`
                : "Geen afspraken vandaag"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayPlannings.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Geen planning voor vandaag
              </div>
            ) : (
              <div className="space-y-3">
                {todayPlannings.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-smans-primary min-w-[45px]">{item.time}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.project}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.employee}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tomorrow's Planning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-smans-primary" />
              Morgen - {format(tomorrow, 'EEEE dd MMMM', { locale: nl })}
            </CardTitle>
            <CardDescription>
              {tomorrowPlannings.length > 0 
                ? `${tomorrowPlannings.length} afspraak${tomorrowPlannings.length > 1 ? 'en' : ''} gepland`
                : "Geen afspraken morgen"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tomorrowPlannings.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Geen planning voor morgen
              </div>
            ) : (
              <div className="space-y-3">
                {tomorrowPlannings.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-smans-primary min-w-[45px]">{item.time}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.project}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.employee}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview and Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-smans-primary" />
              Recente Projecten
            </CardTitle>
            <CardDescription>Overzicht van de laatste projecten</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Geen projecten beschikbaar
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(-5).reverse().map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{project.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {project.customer}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.date).toLocaleDateString('nl-NL')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getProjectStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                      <span className="text-sm font-medium">€{parseFloat(project.value || "0").toLocaleString('nl-NL')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Project Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Huidige verdeling van projectstatussen</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer
              config={{
                waarde: {
                  label: "Aantal projecten",
                  color: "#aa1917",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kozijnenData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="waarde" fill="#aa1917" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activities */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recente Activiteiten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`w-2 h-2 mt-2 rounded-full ${activity.color}`}></div>
                    <div className="ml-4">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nog geen activiteiten</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
