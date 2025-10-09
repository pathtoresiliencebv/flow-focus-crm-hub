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
import { useI18n } from "@/contexts/I18nContext";

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
  const { t } = useI18n();
  
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
      assignedUserId: assignedUserId === 'unassigned' ? '' : assignedUserId,
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
        title: t('error_title', 'Fout'),
        description: t('error_select_customer', 'Selecteer een klant voor het project.'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: t('error_title', 'Fout'), 
        description: t('error_enter_project_name', 'Voer een projectnaam in.'),
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
          title: t('success_title', 'Succes'),
          description: t('success_project_updated', 'Project succesvol bijgewerkt.'),
        });
      } else {
        await addProject(projectData as NewProject);
        toast({
          title: t('success_title', 'Succes'), 
          description: t('success_project_created', 'Project succesvol aangemaakt.'),
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: t('error_title', 'Fout'),
        description: existingProject 
          ? t('error_updating_project', 'Er ging iets mis bij het bijwerken van het project.')
          : t('error_creating_project', 'Er ging iets mis bij het aanmaken van het project.'),
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
          <Label htmlFor="title">{t('label_project_name', 'Projectnaam')} *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('placeholder_project_name', 'Bijvoorbeeld: Kozijnen vervangen')}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">{t('label_customer', 'Klant')} *</Label>
            <div className="flex gap-2">
              <Select value={formData.customerId} onValueChange={handleCustomerChange} required>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={crmLoading ? t('loading_text', 'Laden...') : t('placeholder_select_customer', 'Selecteer klant')} />
                </SelectTrigger>
                <SelectContent>
                  {crmLoading ? (
                    <SelectItem value="" disabled>{t('loading_customers', 'Klanten laden...')}</SelectItem>
                  ) : customers.length === 0 ? (
                    <SelectItem value="" disabled>{t('no_customers_available', 'Geen klanten beschikbaar')}</SelectItem>
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
            <Label htmlFor="status">{t('label_status', 'Status')}</Label>
            <Select value={formData.status ?? 'te-plannen'} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('placeholder_select_status', 'Selecteer status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="te-plannen">{t('project_status_to_plan', 'Te plannen')}</SelectItem>
                <SelectItem value="gepland">{t('project_status_planned', 'Gepland')}</SelectItem>
                <SelectItem value="in-uitvoering">{t('project_status_in_progress', 'In uitvoering')}</SelectItem>
                <SelectItem value="herkeuring">{t('project_status_inspection', 'Herkeuring')}</SelectItem>
                <SelectItem value="afgerond">{t('project_status_completed', 'Afgerond')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasPermission('projects_edit') && (
          <div className="space-y-2">
            <Label htmlFor="assignedUser">{t('label_assigned_to', 'Toegewezen aan')}</Label>
            <Select value={formData.assignedUserId || 'unassigned'} onValueChange={handleAssignedUserChange}>
              <SelectTrigger>
                <SelectValue placeholder={usersLoading ? t('loading_text', 'Laden...') : t('placeholder_select_installer', 'Selecteer installateur')} />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <SelectItem value="" disabled>{t('loading_installers', 'Monteurs laden...')}</SelectItem>
                ) : usersError ? (
                  <SelectItem value="" disabled>{t('error_loading_installers', 'Fout bij laden monteurs')}</SelectItem>
                ) : (
                  <>
                    <SelectItem value="unassigned">{t('no_assignment', 'Geen toewijzing')}</SelectItem>
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
            <Label htmlFor="date">{t('label_planned_date', 'Geplande datum')}</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">{t('label_project_value', 'Projectwaarde')} (€)</Label>
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
          <Label htmlFor="description">{t('label_description', 'Beschrijving')}</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder={t('placeholder_project_description', 'Beschrijf het project...')}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
          {t('button_cancel', 'Annuleren')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {existingProject ? t('button_updating', 'Bijwerken...') : t('button_creating', 'Aanmaken...')}
            </>
          ) : (
            existingProject ? t('button_update', 'Bijwerken') : t('button_create', 'Aanmaken')
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};
