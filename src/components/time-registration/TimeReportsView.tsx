
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const TimeReportsView = () => {
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
                <p className="text-3xl font-bold">36.5 uren</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Gemiddeld per dag</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">7.3 uren</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Totaal factureerbaar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">32.0 uren</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
