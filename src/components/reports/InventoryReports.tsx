
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { inventoryData } from "@/data/mockReportData";

export const InventoryReports = () => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};
