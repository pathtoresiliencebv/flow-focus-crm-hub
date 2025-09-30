import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmStore, ProjectWithCustomerName as Project, NewProject, UpdateProject } from "@/hooks/useCrmStore";
import { CustomerQuickAdd } from "./CustomerQuickAdd";
import { Plus, Loader2 } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ProjectStatus = "te-plannen" | "gepland" | "in-uitvoering" | "herkeuring" | "afgerond";
interface ProjectFormProps {
  onClose: () => void;
  initialStatus?: ProjectStatus;
  existingProject?: Project;
}

export const ProjectForm = ({ onClose, initialStatus = "te-plannen", existingProject }: ProjectFormProps) => {
  const { addProject, updateProject, customers, isLoading: crmLoading } = useCrmStore();
  const { monteurs, isLoading: usersLoading, error: usersError } = useUsers();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  
  // Debug logging
  console.log('🏗️ ProjectForm render:', {
    customers: customers?.length,
    monteurs: monteurs?.length,
    crmLoading,
    usersLoading,
    usersError,
    initialStatus,
    existingProject: existingProject?.id
  });
  const [showCustomerAdd, setShowCustomerAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: existingProject?.title || "",
    customerId: existingProject?.customer_id || "",
    date: existingProject?.date || "",
    value: existingProject?.value || "",
    status: existingProject?.status || initialStatus,
    description: existingProject?.description || "",
    assignedUserId: existingProject?.assigned_user_id || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomerChange = (customerId: string) => {
    setFormData((prev) => ({
      ...prev,
      customerId,
    }));
  };

  const handleStatusChange = (status: ProjectStatus) => {
    setFormData((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleAssignedUserChange = (assignedUserId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedUserId,
    }));
  };

  const handleCustomerAdded = (customerId: string) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customerId,
    }));
    setShowCustomerAdd(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verbeterde form validatie
    if (!formData.customerId) {
      toast({
        title: "Fout",
        description: "Selecteer een klant voor het project.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Fout", 
        description: "Voer een projectnaam in.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData: Omit<NewProject, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { id?: string } = {
        title: formData.title.trim(),
        customer_id: formData.customerId,
        date: formData.date || null,
        value: Number(formData.value) || null,
        status: formData.status as ProjectStatus,
        description: formData.description?.trim() || null,
        assigned_user_id: formData.assignedUserId || null,
      };

      if (existingProject) {
        await updateProject(existingProject.id, projectData as UpdateProject);
        toast({
          title: "Succes",
          description: "Project succesvol bijgewerkt.",
        });
      } else {
        await addProject(projectData as NewProject);
        toast({
          title: "Succes", 
          description: "Project succesvol aangemaakt.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Fout",
        description: existingProject 
          ? "Er ging iets mis bij het bijwerken van het project."
          : "Er ging iets mis bij het aanmaken van het project.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCustomerAdd) {
    return (
      <div>
        <CustomerQuickAdd 
          onCustomerAdded={handleCustomerAdded}
          onCancel={() => setShowCustomerAdd(false)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Projectnaam *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Bijvoorbeeld: Kozijnen vervangen"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Klant *</Label>
            <div className="flex gap-2">
              <Select value={formData.customerId} onValueChange={handleCustomerChange} required>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={crmLoading ? "Laden..." : "Selecteer klant"} />
                </SelectTrigger>
                <SelectContent>
                  {crmLoading ? (
                    <SelectItem value="" disabled>Klanten laden...</SelectItem>
                  ) : customers.length === 0 ? (
                    <SelectItem value="" disabled>Geen klanten beschikbaar</SelectItem>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowCustomerAdd(true)}
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status ?? 'te-plannen'} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="te-plannen">Te plannen</SelectItem>
                <SelectItem value="gepland">Gepland</SelectItem>
                <SelectItem value="in-uitvoering">In uitvoering</SelectItem>
                <SelectItem value="herkeuring">Herkeuring</SelectItem>
                <SelectItem value="afgerond">Afgerond</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasPermission('projects_edit') && (
          <div className="space-y-2">
            <Label htmlFor="assignedUser">Toegewezen aan</Label>
            <Select value={formData.assignedUserId} onValueChange={handleAssignedUserChange}>
              <SelectTrigger>
                <SelectValue placeholder={usersLoading ? "Laden..." : "Selecteer installateur"} />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <SelectItem value="" disabled>Monteurs laden...</SelectItem>
                ) : usersError ? (
                  <SelectItem value="" disabled>Fout bij laden monteurs</SelectItem>
                ) : (
                  <>
                    <SelectItem value="">Geen toewijzing</SelectItem>
                    {monteurs.map((monteur) => (
                      <SelectItem key={monteur.id} value={monteur.id}>
                        {monteur.full_name || monteur.email}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Geplande datum</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Projectwaarde (€)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="0"
              step="0.01"
              value={formData.value ?? ''}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Beschrijving</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Beschrijf het project..."
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
          Annuleren
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {existingProject ? "Bijwerken..." : "Aanmaken..."}
            </>
          ) : (
            existingProject ? "Bijwerken" : "Aanmaken"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};
