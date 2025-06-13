
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUserStore } from "@/hooks/useUserStore";

interface ProjectPersonnelAssignment {
  id: string;
  userId: number;
  userName: string;
  role: string;
  hourlyRate: number;
  estimatedHours: number;
}

interface ProjectPersonnelProps {
  projectId: string;
}

export const ProjectPersonnel = ({ projectId }: ProjectPersonnelProps) => {
  const { users } = useUserStore();
  const installers = users.filter(user => user.role === "Installateur");
  
  const [assignments, setAssignments] = useState<ProjectPersonnelAssignment[]>([
    {
      id: "1",
      userId: 2,
      userName: "Piet Bakker",
      role: "Hoofdmonteur",
      hourlyRate: 45.00,
      estimatedHours: 16
    }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    role: "Monteur",
    hourlyRate: 35.00,
    estimatedHours: 8
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedUser = installers.find(u => u.id.toString() === formData.userId);
    if (!selectedUser) return;

    const newAssignment: ProjectPersonnelAssignment = {
      id: Date.now().toString(),
      userId: selectedUser.id,
      userName: selectedUser.name,
      role: formData.role,
      hourlyRate: formData.hourlyRate,
      estimatedHours: formData.estimatedHours
    };
    
    setAssignments(prev => [...prev, newAssignment]);
    setFormData({ userId: "", role: "Monteur", hourlyRate: 35.00, estimatedHours: 8 });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const totalLaborCost = assignments.reduce((sum, assignment) => 
    sum + (assignment.hourlyRate * assignment.estimatedHours), 0
  );

  const totalEstimatedHours = assignments.reduce((sum, assignment) => 
    sum + assignment.estimatedHours, 0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Toegewezen personeel</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Personeel toewijzen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Personeel toewijzen aan project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Monteur</label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer monteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {installers.map((installer) => (
                      <SelectItem key={installer.id} value={installer.id.toString()}>
                        {installer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol in project</label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hoofdmonteur">Hoofdmonteur</SelectItem>
                    <SelectItem value="Monteur">Monteur</SelectItem>
                    <SelectItem value="Assistent">Assistent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Uurtarief (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Geschatte uren</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">
                  Toewijzen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nog geen personeel toegewezen aan dit project.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Uurtarief</TableHead>
                  <TableHead>Geschatte uren</TableHead>
                  <TableHead>Totaal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.userName}</TableCell>
                    <TableCell>{assignment.role}</TableCell>
                    <TableCell>€{assignment.hourlyRate.toFixed(2)}</TableCell>
                    <TableCell>{assignment.estimatedHours}h</TableCell>
                    <TableCell>€{(assignment.hourlyRate * assignment.estimatedHours).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span>Totale geschatte uren:</span>
                <span className="font-semibold">{totalEstimatedHours}h</span>
              </div>
              <div className="flex justify-between items-center font-semibold">
                <span>Totale arbeidskosten:</span>
                <span>€{totalLaborCost.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
