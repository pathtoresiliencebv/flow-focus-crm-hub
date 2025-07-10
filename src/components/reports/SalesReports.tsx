
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReportsData } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesReportsProps {
  period: string;
}

export const SalesReports = ({ period }: SalesReportsProps) => {
  const { salesData, loading, error } = useReportsData(period);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="h-80">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!salesData) return null;

  const salesGrowth = salesData.previousPeriodSales > 0 
    ? ((salesData.totalSales - salesData.previousPeriodSales) / salesData.previousPeriodSales * 100).toFixed(1)
    : '0';

  const customerGrowth = salesData.previousPeriodCustomers > 0
    ? salesData.newCustomers - salesData.previousPeriodCustomers
    : salesData.newCustomers;

  const aovGrowth = salesData.previousPeriodAOV > 0
    ? ((salesData.averageOrderValue - salesData.previousPeriodAOV) / salesData.previousPeriodAOV * 100).toFixed(1)
    : '0';
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Totale verkopen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">€{salesData.totalSales.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              {Number(salesGrowth) >= 0 ? '+' : ''}{salesGrowth}% t.o.v. vorige periode
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nieuwe klanten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{salesData.newCustomers}</p>
            <p className="text-sm text-muted-foreground">
              {customerGrowth >= 0 ? '+' : ''}{customerGrowth} t.o.v. vorige periode
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gemiddelde orderwaarde</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">€{salesData.averageOrderValue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              {Number(aovGrowth) >= 0 ? '+' : ''}{aovGrowth}% t.o.v. vorige periode
            </p>
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
              data={salesData.monthlySalesData}
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
