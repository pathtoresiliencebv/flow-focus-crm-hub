
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { useCrmStore } from "@/hooks/useCrmStore";

export const Dashboard = () => {
  const { customers, projects } = useCrmStore();

  // Calculate real statistics
  const totalCustomers = customers.length;
  const activeProjects = projects.filter(p => p.status !== "afgerond").length;
  const totalRevenue = projects
    .filter(p => p.status === "afgerond")
    .reduce((sum, p) => sum + parseFloat(p.value || "0"), 0);
  const plannedProjects = projects.filter(p => p.status === "gepland").length;

  // Mock data for charts (in a real app, this would come from your database)
  const revenueData = [
    { name: "Jan", totaal: 4200 },
    { name: "Feb", totaal: 4800 },
    { name: "Mrt", totaal: 5600 },
    { name: "Apr", totaal: 6200 },
    { name: "Mei", totaal: Math.round(totalRevenue) },
  ];

  const projectData = [
    { name: "Jan", afgerond: 8, nieuw: 12 },
    { name: "Feb", afgerond: 10, nieuw: 9 },
    { name: "Mrt", afgerond: 12, nieuw: 15 },
    { name: "Apr", afgerond: 15, nieuw: 11 },
    { name: "Mei", afgerond: projects.filter(p => p.status === "afgerond").length, nieuw: projects.filter(p => p.status === "te-plannen").length },
  ];

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

  // Recent activities based on real data
  const recentActivities = [
    ...customers.slice(-2).map(customer => ({
      description: `Nieuwe klant geregistreerd: ${customer.name}`,
      timestamp: new Date(customer.createdAt).toLocaleDateString('nl-NL'),
      color: "bg-purple-500"
    })),
    ...projects.slice(-3).map(project => ({
      description: `Project "${project.title}" aangemaakt voor ${project.customer}`,
      timestamp: new Date(project.createdAt).toLocaleDateString('nl-NL'),
      color: project.status === "afgerond" ? "bg-green-500" : "bg-blue-500"
    }))
  ].slice(0, 5);

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
            <p className="text-xs text-blue-600 font-semibold">Deze maand</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Maandomzet</CardTitle>
            <CardDescription>Omzet van de afgelopen maanden in Euro's</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer
              config={{
                totaal: {
                  label: "Omzet",
                  color: "#4f46e5",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Maand
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].payload.name}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Omzet
                              </span>
                              <span className="font-bold">
                                €{payload[0].value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Area
                    type="monotone"
                    dataKey="totaal"
                    stroke="#4f46e5"
                    fillOpacity={1}
                    fill="url(#colorUv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
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
                  color: "#4f46e5",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kozijnenData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="waarde" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-3">
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
