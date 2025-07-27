
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTimeRegistrations } from "@/hooks/useTimeRegistrations";
import { Loader2 } from "lucide-react";

export const TimeEntriesOverview = () => {
  const { getFormattedTimeRegistrations, isLoading, updateApproval } = useTimeRegistrations();
  const timeEntries = getFormattedTimeRegistrations();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Tijdsregistraties laden...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tijdsregistraties deze week</CardTitle>
        <CardDescription>Overzicht van geregistreerde uren per project</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {timeEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nog geen tijdsregistraties gevonden. Maak je eerste registratie aan!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Activiteit</TableHead>
                <TableHead>Uren</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell className="font-medium">{entry.project}</TableCell>
                  <TableCell>{entry.activity}</TableCell>
                  <TableCell>{entry.hours}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      entry.status === "Goedgekeurd" ? "bg-green-100 text-green-800" :
                      entry.status === "In behandeling" ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {entry.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.description || '-'}
                  </TableCell>
                  <TableCell>
                    {entry.status === "In behandeling" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateApproval({ id: entry.id, isApproved: true })}
                      >
                        Goedkeuren
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
