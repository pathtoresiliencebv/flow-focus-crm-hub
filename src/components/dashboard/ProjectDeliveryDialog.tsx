import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { X } from "lucide-react";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useProjectDelivery } from "@/hooks/useProjectDelivery";
import { toast } from "@/hooks/use-toast";

interface ProjectDeliveryDialogProps {
  project: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const ProjectDeliveryDialog = ({ project, isOpen, onClose, onComplete }: ProjectDeliveryDialogProps) => {
  const { tasksByBlock } = useProjectTasks(project.id);
  const { completeProject, isCompleting } = useProjectDelivery();
  
  const [formData, setFormData] = useState({
    clientName: '',
    deliverySummary: '',
    deliveryPhotos: [] as string[],
    clientSignature: '',
    monteurSignature: '',
    selectedTasks: new Set<string>()
  });

  // Get all completed tasks
  const completedTasks = Object.values(tasksByBlock)
    .flat()
    .filter(task => !task.is_info_block && task.is_completed);

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const newSelected = new Set(formData.selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setFormData(prev => ({ ...prev, selectedTasks: newSelected }));
  };

  const handleSubmit = async () => {
    if (!formData.clientName.trim()) {
      toast({
        title: "Ontbrekende gegevens",
        description: "Vul de naam van de klant in.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.deliverySummary.trim()) {
      toast({
        title: "Ontbrekende gegevens", 
        description: "Vul een samenvatting van de oplevering in.",
        variant: "destructive"
      });
      return;
    }

    if (formData.selectedTasks.size === 0) {
      toast({
        title: "Geen taken geselecteerd",
        description: "Selecteer minimaal één uitgevoerde taak voor de werkbon.",
        variant: "destructive"
      });
      return;
    }

    try {
      await completeProject({
        project_id: project.id,
        client_name: formData.clientName,
        delivery_summary: formData.deliverySummary,
        delivery_photos: formData.deliveryPhotos,
        client_signature_data: formData.clientSignature,
        monteur_signature_data: formData.monteurSignature
      });

      toast({
        title: "Project opgeleverd",
        description: "Het project is succesvol opgeleverd.",
      });

      onComplete();
    } catch (error) {
      toast({
        title: "Fout bij opleveren",
        description: "Er is een fout opgetreden bij het opleveren van het project.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Opleveren - {project.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Naam klant *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Naam van de persoon die het project ontvangt"
              />
            </div>
          </div>

          {/* Delivery Summary */}
          <div>
            <Label htmlFor="deliverySummary">Samenvatting oplevering *</Label>
            <Textarea
              id="deliverySummary"
              value={formData.deliverySummary}
              onChange={(e) => setFormData(prev => ({ ...prev, deliverySummary: e.target.value }))}
              placeholder="Beschrijf wat er is opgeleverd en eventuele bijzonderheden"
              rows={3}
            />
          </div>

          {/* Task Selection for Work Order */}
          <Card>
            <CardHeader>
              <CardTitle>Uitgevoerde werkzaamheden voor werkbon</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecteer welke taken op de werkbon moeten komen
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(tasksByBlock).map(([blockTitle, tasks]) => {
                const completedBlockTasks = tasks.filter(task => !task.is_info_block && task.is_completed);
                
                if (completedBlockTasks.length === 0) return null;

                return (
                  <div key={blockTitle} className="space-y-2">
                    <h4 className="font-medium text-sm">{blockTitle}</h4>
                    {completedBlockTasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={task.id}
                          checked={formData.selectedTasks.has(task.id)}
                          onCheckedChange={(checked) => handleTaskSelection(task.id, !!checked)}
                        />
                        <Label 
                          htmlFor={task.id} 
                          className="text-sm cursor-pointer"
                        >
                          {task.task_description}
                        </Label>
                      </div>
                    ))}
                  </div>
                );
              })}

              {completedTasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Geen voltooide taken beschikbaar. Markeer eerst taken als voltooid in het project.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <div>
            <Label>Opleverfoto's</Label>
            <div className="grid grid-cols-1 gap-2">
              {formData.deliveryPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover rounded" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      deliveryPhotos: prev.deliveryPhotos.filter((_, i) => i !== index)
                    }))}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <ImageUpload
                value={null}
                onChange={(url) => {
                  if (url) {
                    setFormData(prev => ({ ...prev, deliveryPhotos: [...prev.deliveryPhotos, url] }));
                  }
                }}
              />
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Handtekening klant</Label>
              <SignatureCanvas
                onSignature={(signature) => setFormData(prev => ({ ...prev, clientSignature: signature }))}
                title="Handtekening klant"
              />
            </div>
            <div>
              <Label>Handtekening monteur</Label>
              <SignatureCanvas
                onSignature={(signature) => setFormData(prev => ({ ...prev, monteurSignature: signature }))}
                title="Handtekening monteur"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isCompleting}
            >
              {isCompleting ? 'Bezig met opleveren...' : 'Project Opleveren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};