
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrmStore, Project } from "@/hooks/useCrmStore";
import { CustomerQuickAdd } from "./CustomerQuickAdd";
import { Plus } from "lucide-react";

interface ProjectFormProps {
  onClose: () => void;
  initialStatus?: "te-plannen" | "gepland" | "in-uitvoering" | "herkeuring" | "afgerond";
  existingProject?: Project;
}

export const ProjectForm = ({ onClose, initialStatus = "te-plannen", existingProject }: ProjectFormProps) => {
  const { addProject, updateProject, customers } = useCrmStore();
  const [showCustomerAdd, setShowCustomerAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: existingProject?.title || "",
    customerId: existingProject?.customerId?.toString() || "",
    date: existingProject?.date || "",
    value: existingProject?.value || "",
    status: existingProject?.status || initialStatus,
    description: existingProject?.description || "",
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

  const handleStatusChange = (status: "te-plannen" | "gepland" | "in-uitvoering" | "herkeuring" | "afgerond") => {
    setFormData((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleCustomerAdded = (customerId: number) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customerId.toString(),
    }));
    setShowCustomerAdd(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCustomer = customers.find(c => c.id.toString() === formData.customerId);
    if (!selectedCustomer) return;

    const projectData = {
      title: formData.title,
      customer: selectedCustomer.name,
      customerId: selectedCustomer.id,
      date: formData.date,
      value: formData.value,
      status: formData.status,
      description: formData.description,
    };

    if (existingProject) {
      updateProject(existingProject.id, projectData);
    } else {
      addProject(projectData);
    }
    
    onClose();
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
                  <SelectValue placeholder="Selecteer klant" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
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
            <Select value={formData.status} onValueChange={handleStatusChange}>
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
              value={formData.value}
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
        <Button variant="outline" type="button" onClick={onClose}>
          Annuleren
        </Button>
        <Button type="submit">
          {existingProject ? "Bijwerken" : "Aanmaken"}
        </Button>
      </DialogFooter>
    </form>
  );
};
