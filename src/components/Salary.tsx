
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Salary = () => {
  const [month, setMonth] = useState('Mei');
  const [year, setYear] = useState('2025');
  const { toast } = useToast();

  const handleProcessSalaries = () => {
    toast({
      title: "Salarissen verwerkt",
      description: `Salarissen voor ${month} ${year} zijn succesvol verwerkt.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Salarisadministratie</h2>
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Maand" />
            </SelectTrigger>
            <SelectContent>
              {['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'].map(month => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Jaar" />
            </SelectTrigger>
            <SelectContent>
              {['2024', '2025', '2026'].map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleProcessSalaries}>Salarissen verwerken</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overzicht</TabsTrigger>
          <TabsTrigger value="history">Historie</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Salaris overzicht Mei 2025</CardTitle>
              <CardDescription>Status van de salarisverwerking voor deze maand</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medewerker</TableHead>
                    <TableHead>Functie</TableHead>
                    <TableHead>Uren</TableHead>
                    <TableHead>Bruto salaris</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSalaryData.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.employee}</TableCell>
                      <TableCell>{entry.position}</TableCell>
                      <TableCell>{entry.hours}</TableCell>
                      <TableCell>€{entry.grossSalary}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.status === "Verwerkt" ? "bg-green-100 text-green-800" :
                          entry.status === "In behandeling" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {entry.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Details</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Salaris details - {entry.employee}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                              <div>
                                <p className="text-sm font-medium mb-1">Bruto salaris:</p>
                                <p>€{entry.grossSalary}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">Belasting:</p>
                                <p>€{Math.round(parseInt(entry.grossSalary) * 0.3689)}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">Pensioen:</p>
                                <p>€{Math.round(parseInt(entry.grossSalary) * 0.07)}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">Verzekeringen:</p>
                                <p>€{Math.round(parseInt(entry.grossSalary) * 0.0245)}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-medium mb-1">Netto salaris:</p>
                                <p className="font-bold">€{Math.round(parseInt(entry.grossSalary) * 0.6066)}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Totaal bruto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€18,425</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Totaal netto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€11,177</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Werkgeverslasten</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">€4,975</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Salarishistorie</CardTitle>
              <CardDescription>Overzicht van eerder verwerkte salarissen</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Medewerkers</TableHead>
                    <TableHead>Totaal bruto</TableHead>
                    <TableHead>Totaal netto</TableHead>
                    <TableHead>Verwerkingsdatum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>April 2025</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>€18,425</TableCell>
                    <TableCell>€11,177</TableCell>
                    <TableCell>28-04-2025</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maart 2025</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>€18,425</TableCell>
                    <TableCell>€11,177</TableCell>
                    <TableCell>28-03-2025</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Februari 2025</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell>€18,425</TableCell>
                    <TableCell>€11,177</TableCell>
                    <TableCell>28-02-2025</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Salarisinstellingen</CardTitle>
              <CardDescription>Algemene instellingen voor de salarisadministratie</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Verwerkingsdatum</label>
                  <Select defaultValue="28">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dag van de maand waarop salarissen worden verwerkt
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Standaard werkuren per week</label>
                  <Input type="number" defaultValue={40} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Standaard aantal werkuren per week voor fulltime werknemers
                  </p>
                </div>
              </div>

              <Button>Instellingen opslaan</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const mockSalaryData = [
  { id: 1, employee: "Jan de Vries", position: "Administrator", hours: 160, grossSalary: "4,250", status: "Verwerkt" },
  { id: 2, employee: "Marie Jansen", position: "Verkoper", hours: 160, grossSalary: "3,850", status: "Verwerkt" },
  { id: 3, employee: "Peter Bakker", position: "Installateur", hours: 160, grossSalary: "3,650", status: "In behandeling" },
  { id: 4, employee: "Sara Visser", position: "Administratie", hours: 120, grossSalary: "2,775", status: "Concept" },
  { id: 5, employee: "Thomas Mulder", position: "Verkoper", hours: 160, grossSalary: "3,900", status: "Verwerkt" },
];

export default Salary;
