
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { salesData } from "@/data/mockReportData";

export const SalesReports = () => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};
