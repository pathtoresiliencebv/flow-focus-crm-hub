
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockTimeEntries } from "@/data/mockTimeEntries";

export const TimeEntriesOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tijdsregistraties deze week</CardTitle>
        <CardDescription>Overzicht van geregistreerde uren per project</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Activiteit</TableHead>
              <TableHead>Uren</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTimeEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.date}</TableCell>
                <TableCell>{entry.project}</TableCell>
                <TableCell>{entry.activity}</TableCell>
                <TableCell>{entry.hours}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    entry.status === "Gefiatteerd" ? "bg-green-100 text-green-800" :
                    entry.status === "In behandeling" ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {entry.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
