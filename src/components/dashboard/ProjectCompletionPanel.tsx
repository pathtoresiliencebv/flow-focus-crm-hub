import React, { useState, useEffect } from "react";
import { SlidePanel } from "@/components/ui/slide-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useProjectCompletion, ProjectCompletionData } from "@/hooks/useProjectCompletion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface ProjectCompletionPanelProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const ProjectCompletionPanel = ({ project, isOpen, onClose, onComplete }: ProjectCompletionPanelProps) => {
  const { tasksByBlock, loading: tasksLoading } = useProjectTasks(project.id);
  const { completeProject, isCompleting } = useProjectCompletion();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    clientName: project.customer?.name || '',
    deliverySummary: '',
    deliveryPhotos: [] as { url: string; category: string; description: string }[],
    clientSignature: '',
    monteurSignature: '',
    selectedTasks: new Set<string>()
  });
  const [previouslyCompletedTasks, setPreviouslyCompletedTasks] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Pre-select all currently completed tasks
      const allTasks = Object.values(tasksByBlock).flat();
      const completedNow = allTasks.filter(task => task.is_completed && !task.work_order_id);
      const newSelected = new Set(completedNow.map(t => t.id));
      setFormData(prev => ({ ...prev, selectedTasks: newSelected }));

      // Separate tasks that were already part of a previous work order
      const alreadyInWorkOrder = allTasks.filter(task => !!task.work_order_id);
      setPreviouslyCompletedTasks(alreadyInWorkOrder);

    }
  }, [isOpen, tasksByBlock]);

  const handleSubmit = async () => {
    console.log("Form data on submit:", formData);

    // --- Validation ---
    if (!formData.clientName.trim()) {
      toast({ title: "Validatie Fout", description: "Naam van de klant is verplicht.", variant: "destructive" });
      return;
    }
    if (!formData.deliverySummary.trim()) {
      toast({ title: "Validatie Fout", description: "Samenvatting is verplicht.", variant: "destructive" });
      return;
    }
    if (!formData.monteurSignature) {
      toast({ title: "Validatie Fout", description: "Handtekening van de monteur is verplicht.", variant: "destructive" });
      return;
    }

    if (!project) return;

    const completionPayload = {
      completionData: {
        project_id: project.id,
        client_name: formData.clientName,
        work_performed: formData.deliverySummary,
        client_signature: formData.clientSignature,
        installer_signature: formData.monteurSignature,
        client_signature_timestamp: new Date().toISOString(),
      },
      photos: formData.deliveryPhotos,
      selectedTasks: formData.selectedTasks,
    };

    try {
      await completeProject(completionPayload);
      onClose(); // Close the panel on success
    } catch (error) {
      // Error is already handled by react-query's onError, but you could add specific logic here if needed
      console.error("Completion failed:", error);
    }
  };

  if (!project) return null;

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`Project Opleveren - ${project.title}`}
      size="xl"
    >
      <div className="h-full overflow-y-auto p-6 space-y-6">
        {/* Form fields: Client Name, Summary, etc. */}
        <div>
          <Label htmlFor="clientName">Naam klant *</Label>
          <Input id="clientName" value={formData.clientName} onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="deliverySummary">Samenvatting oplevering *</Label>
          <Textarea id="deliverySummary" value={formData.deliverySummary} onChange={(e) => setFormData(prev => ({ ...prev, deliverySummary: e.target.value }))} />
        </div>

        {/* Tasks already in a work order */}
        {previouslyCompletedTasks.length > 0 && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Reeds Opgeleverde Taken</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {previouslyCompletedTasks.map(task => (
                <div key={task.id} className="flex items-center space-x-2 text-gray-500">
                  <Checkbox id={task.id} checked disabled />
                  <Label htmlFor={task.id} className="cursor-not-allowed">{task.task_description}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* New tasks to be added to this work order */}
        <Card>
          <CardHeader>
            <CardTitle>Uitgevoerde Werkzaamheden voor Nieuwe Werkbon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(tasksByBlock).map(([blockTitle, tasks]) => {
              const newTasks = tasks.filter(task => !task.work_order_id && !task.is_info_block);
              if (newTasks.length === 0) return null;
              return (
                <div key={blockTitle}>
                  <h4 className="font-medium text-sm">{blockTitle}</h4>
                  {newTasks.map(task => (
                    <div key={task.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={task.id}
                        checked={formData.selectedTasks.has(task.id)}
                        onCheckedChange={(checked) => {
                           const newSelected = new Set(formData.selectedTasks);
                           if (checked) newSelected.add(task.id);
                           else newSelected.delete(task.id);
                           setFormData(prev => ({ ...prev, selectedTasks: newSelected }));
                        }}
                      />
                      <Label htmlFor={task.id}>{task.task_description}</Label>
                    </div>
                  ))}
                </div>
              );
            })}
          </CardContent>
        </Card>
        
        {/* Photo Upload */}
        <div>
          <Label>Opleverfoto's</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {formData.deliveryPhotos.map((photo, index) => (
              <div key={index} className="relative">
                <img src={photo.url} alt={`Opleverfoto ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      deliveryPhotos: prev.deliveryPhotos.filter((_, i) => i !== index)
                    }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <ImageUpload
            value={null}
            onChange={(url) => {
              if (url) {
                setFormData(prev => ({
                  ...prev,
                  deliveryPhotos: [...prev.deliveryPhotos, { url, category: 'after', description: 'Opleverfoto' }]
                }));
              }
            }}
          />
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Handtekening klant</Label>
            <SignatureCanvas onSignature={(sig) => setFormData(prev => ({...prev, clientSignature: sig}))} />
          </div>
          <div>
            <Label>Handtekening monteur</Label>
            <SignatureCanvas onSignature={(sig) => setFormData(prev => ({...prev, monteurSignature: sig}))} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Annuleren</Button>
          <Button onClick={handleSubmit} disabled={isCompleting}>
            {isCompleting ? 'Bezig...' : 'Project Opleveren & Werkbon Aanmaken'}
          </Button>
        </div>
      </div>
    </SlidePanel>
  );
};
