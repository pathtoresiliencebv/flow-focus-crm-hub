
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { PlanningItem } from "./types";

interface PlanningListViewProps {
  planningItems: PlanningItem[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Gepland": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Bevestigd": return "bg-green-100 text-green-800 border-green-200";
    case "Afgerond": return "bg-gray-100 text-gray-800 border-gray-200";
    case "Geannuleerd": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const PlanningListView = ({ planningItems }: PlanningListViewProps) => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">Alle Planningen</CardTitle>
            <CardDescription className="text-gray-600 text-sm sm:text-base">Overzicht van alle geplande activiteiten</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-xs sm:text-sm">Datum</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm">Tijd</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Monteur</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm">Project</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">Locatie</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm">Status</TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planningItems
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((item) => (
                <TableRow key={item.id} className="hover:bg-blue-50 transition-colors">
                  <TableCell className="font-medium text-xs sm:text-sm">{format(new Date(item.date), 'dd MMM yyyy', { locale: nl })}</TableCell>
                  <TableCell className="font-mono text-xs sm:text-sm">{item.time}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{item.employee}</TableCell>
                  <TableCell className="font-medium text-xs sm:text-sm">{item.project}</TableCell>
                  <TableCell className="max-w-xs truncate hidden lg:table-cell text-xs sm:text-sm">{item.location}</TableCell>
                  <TableCell>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="hover:bg-blue-100 text-xs sm:text-sm">
                      Bewerken
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
