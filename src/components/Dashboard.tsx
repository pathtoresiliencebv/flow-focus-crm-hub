
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip } from "recharts";

export const Dashboard = () => {
  // Mock data for charts
  const revenueData = [
    { name: "Jan", totaal: 4200 },
    { name: "Feb", totaal: 4800 },
    { name: "Mrt", totaal: 5600 },
    { name: "Apr", totaal: 6200 },
    { name: "Mei", totaal: 7500 },
  ];

  const projectData = [
    { name: "Jan", afgerond: 8, nieuw: 12 },
    { name: "Feb", afgerond: 10, nieuw: 9 },
    { name: "Mrt", afgerond: 12, nieuw: 15 },
    { name: "Apr", afgerond: 15, nieuw: 11 },
    { name: "Mei", afgerond: 8, nieuw: 14 },
  ];

  const kozijnenData = [
    { name: "Kunststof", waarde: 28 },
    { name: "Aluminium", waarde: 22 },
    { name: "Hout", waarde: 18 },
    { name: "Composiet", waarde: 12 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totale Klanten</CardDescription>
            <CardTitle className="text-3xl">142</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600 font-semibold">+12% t.o.v. vorige maand</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actieve Projecten</CardDescription>
            <CardTitle className="text-3xl">27</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-yellow-600 font-semibold">+3% t.o.v. vorige maand</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Maandomzet</CardDescription>
            <CardTitle className="text-3xl">€8.745</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-600 font-semibold">+18% t.o.v. vorige maand</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Geplande Afspraken</CardDescription>
            <CardTitle className="text-3xl">14</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-600 font-semibold">Voor de komende week</p>
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
            <CardTitle>Projecten</CardTitle>
            <CardDescription>Nieuwe en afgeronde projecten per maand</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer
              config={{
                nieuw: {
                  label: "Nieuwe Projecten",
                  color: "#4f46e5",
                },
                afgerond: {
                  label: "Afgeronde Projecten",
                  color: "#10b981",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="nieuw" fill="#4f46e5" />
                  <Bar dataKey="afgerond" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* More stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Kozijn Types</CardTitle>
            <CardDescription>Meest verkochte kozijn types</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <ChartContainer
              config={{
                waarde: {
                  label: "Aantal verkocht",
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
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Recente Activiteiten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start">
                  <div className={`w-2 h-2 mt-2 rounded-full ${activity.color}`}></div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const activities = [
  { description: "Nieuw project aangemaakt voor Jan de Vries", timestamp: "Vandaag, 09:45", color: "bg-blue-500" },
  { description: "Offerte #2458 is goedgekeurd door Marie Jansen", timestamp: "Vandaag, 09:32", color: "bg-green-500" },
  { description: "Nieuwe klant geregistreerd: Pieter Janssen", timestamp: "Gisteren, 14:20", color: "bg-purple-500" },
  { description: "Afspraak ingepland met Sara Visser", timestamp: "Gisteren, 11:15", color: "bg-yellow-500" },
  { description: "Project #156 is afgerond", timestamp: "2 dagen geleden", color: "bg-green-500" },
];
