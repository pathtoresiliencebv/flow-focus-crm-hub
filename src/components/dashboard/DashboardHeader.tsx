
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Customer } from "@/hooks/useCrmStore";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardHeaderProps {
  customers: Customer[];
  handleCreateProject: (formData: FormData) => void;
  newProjectDialogOpen: boolean;
  setNewProjectDialogOpen: (open: boolean) => void;
}

export const DashboardHeader = ({ customers, handleCreateProject, newProjectDialogOpen, setNewProjectDialogOpen }: DashboardHeaderProps) => {
  const { hasPermission } = useAuth();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Welkom terug! Hier is een overzicht van je bedrijf.</p>
      </div>
      {hasPermission("projects_create") && (
        <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-smans-primary hover:bg-smans-primary/90 text-white shadow-lg hover:shadow-xl transition-all w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nieuw Project
            </Button>
          </DialogTrigger>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Nieuw project aanmaken</DialogTitle>
            <DialogDescription>
              Maak een nieuw project aan voor een klant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateProject(formData);
          }} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Projectnaam</label>
              <Input name="title" className="mt-1" placeholder="Bijv. Kozijnen vervangen" required />
            </div>
            <div>
              <label className="text-sm font-medium">Klant</label>
              <Select name="customer" required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Kies een klant" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Geplande datum</label>
                <Input name="date" type="date" className="mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium">Waarde (€)</label>
                <Input name="value" type="number" className="mt-1" placeholder="0" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Beschrijving</label>
              <Input name="description" className="mt-1" placeholder="Omschrijving van het project" />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setNewProjectDialogOpen(false)} className="w-full sm:w-auto">
                Annuleren
              </Button>
              <Button type="submit" className="bg-smans-primary hover:bg-smans-primary/90 text-white w-full sm:w-auto">
                Project Aanmaken
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
};
