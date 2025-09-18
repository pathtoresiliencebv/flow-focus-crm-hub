import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCrmStore } from "@/hooks/useCrmStore";

interface ProjectQuickAddProps {
  onProjectAdded: (projectId: string) => void;
  onCancel: () => void;
  selectedCustomerId: string;
  selectedCustomerName: string;
}

export const ProjectQuickAdd = ({ 
  onProjectAdded, 
  onCancel, 
  selectedCustomerId,
  selectedCustomerName 
}: ProjectQuickAddProps) => {
  const { toast } = useToast();
  const { addProject } = useCrmStore();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Vereiste velden",
        description: "Vul minimaal een projectnaam in.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const projectData = {
        title: formData.title,
        description: formData.description || null,
        value: formData.value ? parseFloat(formData.value) : null,
        customer_id: selectedCustomerId,
        status: 'te-plannen' as const,
        project_status: 'te-plannen',
        date: null,
        user_id: null, // Will be set by the backend/RLS
      };

      const newProject = await addProject(projectData);
      
      toast({
        title: "Project toegevoegd",
        description: `Project "${formData.title}" is succesvol toegevoegd.`,
      });
      
      // Wait a bit for the data to be properly added before calling the callback
      setTimeout(() => {
        onProjectAdded(newProject.id);
      }, 100);
    } catch (error) {
      console.error("Failed to add project:", error);
      toast({
        title: "Fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Nieuw project toevoegen</CardTitle>
        <p className="text-sm text-muted-foreground">
          Project voor klant: <strong>{selectedCustomerName}</strong>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Projectnaam *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Bijv. Warmtepomp installatie"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optionele beschrijving van het project"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Geschatte waarde (€)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Bezig met toevoegen...' : 'Project toevoegen'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};