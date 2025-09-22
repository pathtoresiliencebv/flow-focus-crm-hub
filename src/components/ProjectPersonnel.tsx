
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Lock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import { useProjectPersonnel } from "@/hooks/useProjectPersonnel";

interface ProjectPersonnelProps {
  projectId: string;
}

export const ProjectPersonnel = ({ projectId }: ProjectPersonnelProps) => {
  const { profile } = useAuth();
  const { monteurs, isLoading: usersLoading } = useUsers();
  const { assignments, loading, addPersonnel, deletePersonnel } = useProjectPersonnel(projectId);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    role: "Monteur",
    hourlyRate: 35.00,
    estimatedHours: 8
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedUser = monteurs.find(u => u.id === formData.userId);
    if (!selectedUser) return;

    const success = await addPersonnel({
      project_id: projectId,
      user_id: selectedUser.id,
      project_role: formData.role,
      hourly_rate: formData.hourlyRate,
      estimated_hours: formData.estimatedHours
    });
    
    if (success) {
      setFormData({ userId: "", role: "Monteur", hourlyRate: 35.00, estimatedHours: 8 });
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePersonnel(id);
  };

  const totalLaborCost = assignments.reduce((sum, assignment) => 
    sum + (assignment.hourly_rate * assignment.estimated_hours), 0
  );

  const totalEstimatedHours = assignments.reduce((sum, assignment) => 
    sum + assignment.estimated_hours, 0
  );
  
  // Check if user has permission to manage personnel
  const canManagePersonnel = profile?.role === 'Administrator' || profile?.role === 'Administratie';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Toegewezen personeel</CardTitle>
        {canManagePersonnel ? (
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
                    {usersLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2">Laden...</span>
                      </div>
                    ) : (
                      monteurs.map((monteur) => (
                        <SelectItem key={monteur.id} value={monteur.id}>
                          {monteur.full_name || monteur.email}
                        </SelectItem>
                      ))
                    )}
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
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Alleen toegankelijk voor administrators</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!canManagePersonnel ? (
          <div className="text-center py-12 space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-medium text-muted-foreground">Geen toegang</p>
              <p className="text-sm text-muted-foreground">
                Personeel beheer is alleen toegankelijk voor administrators en administratie medewerkers.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Personeel laden...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Nog geen personeel toegewezen aan dit project.
            </p>
            <p className="text-sm text-muted-foreground">
              Personeel wordt automatisch gekoppeld wanneer planning wordt ingesteld.
            </p>
          </div>
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
                    <TableCell className="font-medium">{assignment.user_name}</TableCell>
                    <TableCell>{assignment.project_role}</TableCell>
                    <TableCell>€{assignment.hourly_rate.toFixed(2)}</TableCell>
                    <TableCell>{assignment.estimated_hours}h</TableCell>
                    <TableCell>€{(assignment.hourly_rate * assignment.estimated_hours).toFixed(2)}</TableCell>
                    <TableCell>
                      {canManagePersonnel && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
