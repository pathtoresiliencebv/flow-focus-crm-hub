
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeRegistrations } from "@/hooks/useTimeRegistrations";
import { Loader2 } from "lucide-react";

export const TimeReportsView = () => {
  const { getStatistics, isLoading } = useTimeRegistrations();
  const stats = getStatistics();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Statistieken laden...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tijdsrapportage</CardTitle>
        <CardDescription>Analyseer gewerkte uren per project en medewerker</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Totaal deze week</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalHoursThisWeek} uren</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Gemiddeld per dag</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.averageHoursPerDay} uren</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Totaal factureerbaar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.billableHours} uren</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
