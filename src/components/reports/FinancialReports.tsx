
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { financialData } from "@/data/mockReportData";

export const FinancialReports = () => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};
