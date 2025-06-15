
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const Reports = () => {
  const [period, setPeriod] = useState('month');
  const { toast } = useToast();
  
  const handleDownload = () => {
    toast({
      title: "Rapport gedownload",
      description: "Het rapport is succesvol gedownload.",
    });
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Rapportages</h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Deze week</SelectItem>
              <SelectItem value="month">Deze maand</SelectItem>
              <SelectItem value="quarter">Dit kwartaal</SelectItem>
              <SelectItem value="year">Dit jaar</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Exporteren
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">Verkoopcijfers</TabsTrigger>
          <TabsTrigger value="projects">Projectoverzicht</TabsTrigger>
          <TabsTrigger value="finance">Financiële resultaten</TabsTrigger>
          <TabsTrigger value="inventory">Voorraadanalyse</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Totale verkopen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€96,400</p>
                <p className="text-sm text-muted-foreground">+12% t.o.v. vorige periode</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Nieuwe klanten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">14</p>
                <p className="text-sm text-muted-foreground">+3 t.o.v. vorige periode</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Gemiddelde orderwaarde</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€3,450</p>
                <p className="text-sm text-muted-foreground">+5% t.o.v. vorige periode</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Verkoopcijfers per maand</CardTitle>
              <CardDescription>Verkoopomzet gedurende het jaar</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Verkoopomzet" fill="#8884d8" />
                  <Bar dataKey="target" name="Verkoopdoel" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Actieve projecten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">18</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Voltooide projecten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Afgelopen 30 dagen</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Gem. projectduur</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">12 dagen</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projectstatus verdeling</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projectplanning</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={projectTrendData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="started" name="Gestart" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="completed" name="Afgerond" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Totale omzet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€96,400</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kosten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€63,250</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Winst</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€33,150</p>
                <p className="text-sm text-muted-foreground">34.4% marge</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financiële ontwikkeling</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={financialData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Omzet" stroke="#8884d8" />
                  <Line type="monotone" dataKey="costs" name="Kosten" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="profit" name="Winst" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Voorraadwaarde</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€48,750</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Producten in voorraad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">342</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Bestelde producten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">56</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Voorraadniveaus per categorie</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inventoryData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 120,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" name="Huidige voorraad" fill="#8884d8" />
                  <Bar dataKey="minimum" name="Minimum voorraad" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock data for the charts
const salesData = [
  { name: 'Jan', value: 7800, target: 8000 },
  { name: 'Feb', value: 8300, target: 8000 },
  { name: 'Mrt', value: 8900, target: 9000 },
  { name: 'Apr', value: 9200, target: 9000 },
  { name: 'Mei', value: 9600, target: 9500 },
  { name: 'Jun', value: 8800, target: 9500 },
  { name: 'Jul', value: 8400, target: 9000 },
  { name: 'Aug', value: 8700, target: 9000 },
  { name: 'Sep', value: 9100, target: 9500 },
  { name: 'Okt', value: 9400, target: 9500 },
  { name: 'Nov', value: 9800, target: 10000 },
  { name: 'Dec', value: 10400, target: 10000 },
];

const projectStatusData = [
  { name: 'Te plannen', value: 24, color: '#8884d8' },
  { name: 'In uitvoering', value: 18, color: '#83a6ed' },
  { name: 'Afgerond', value: 42, color: '#8dd1e1' },
  { name: 'Herkeuring', value: 8, color: '#82ca9d' },
  { name: 'Geannuleerd', value: 8, color: '#ff8042' },
];

const projectTrendData = [
  { name: 'Week 1', started: 4, completed: 2 },
  { name: 'Week 2', started: 3, completed: 4 },
  { name: 'Week 3', started: 5, completed: 3 },
  { name: 'Week 4', started: 6, completed: 5 },
  { name: 'Week 5', started: 4, completed: 6 },
];

const financialData = [
  { name: 'Jan', revenue: 7800, costs: 5200, profit: 2600 },
  { name: 'Feb', revenue: 8300, costs: 5500, profit: 2800 },
  { name: 'Mrt', revenue: 8900, costs: 5800, profit: 3100 },
  { name: 'Apr', revenue: 9200, costs: 6100, profit: 3100 },
  { name: 'Mei', revenue: 9600, costs: 6300, profit: 3300 },
  { name: 'Jun', revenue: 8800, costs: 5900, profit: 2900 },
];

const inventoryData = [
  { name: 'Kunststof kozijnen', current: 45, minimum: 20 },
  { name: 'Aluminium kozijnen', current: 32, minimum: 15 },
  { name: 'Houten kozijnen', current: 28, minimum: 10 },
  { name: 'Triple glas', current: 55, minimum: 25 },
  { name: 'Dubbel glas', current: 78, minimum: 30 },
  { name: 'Vensterbanken', current: 62, minimum: 20 },
  { name: 'Afstandhouders', current: 42, minimum: 40 },
];

export default Reports;
