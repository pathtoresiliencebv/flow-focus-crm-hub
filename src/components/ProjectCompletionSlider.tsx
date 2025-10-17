import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Clock, 
  Camera, 
  FileText, 
  Star,
  User,
  PenTool,
  AlertCircle
} from "lucide-react";
import { useProjectCompletion } from "@/hooks/useProjectCompletion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { useProjectTasks } from "@/hooks/useProjectTasks";

interface ProjectCompletionSliderProps {
  projectId: string;
  projectName: string;
  customerName: string;
  isCompleted?: boolean;
  onCompletionChange?: () => void;
}

export const ProjectCompletionSlider: React.FC<ProjectCompletionSliderProps> = ({
  projectId,
  projectName,
  customerName,
  isCompleted = false,
  onCompletionChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { completeProject, isCompleting } = useProjectCompletion();
  const { tasksByBlock } = useProjectTasks(projectId);
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  
  // Completion form state
  const [completionData, setCompletionData] = useState({
    workPerformed: '',
    materialsUsed: '',
    recommendations: '',
    notes: '',
    customerSatisfaction: 5,
    customerName: customerName,
    customerSignature: '',
    installerSignature: '',
    followUpRequired: false,
    followUpNotes: ''
  });

  // Get all completed tasks
  const completedTasks = Object.values(tasksByBlock)
    .flat()
    .filter(task => !task.is_info_block && task.is_completed);

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTaskIds);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleCompleteProject = async () => {
    if (!completionData.workPerformed.trim() || !completionData.customerSignature || !completionData.installerSignature) {
      toast({
        title: "Incomplete gegevens",
        description: "Vul alle verplichte velden in en zet beide handtekeningen",
        variant: "destructive",
      });
      return;
    }

    try {
      await completeProject({
        project_id: projectId,
        completion_date: new Date().toISOString().split('T')[0],
        work_performed: completionData.workPerformed,
        materials_used: completionData.materialsUsed || undefined,
        recommendations: completionData.recommendations || undefined,
        notes: completionData.notes || undefined,
        customer_satisfaction: completionData.customerSatisfaction,
        customer_signature: completionData.customerSignature,
        installer_signature: completionData.installerSignature,
        customer_name: completionData.customerName,
        follow_up_required: completionData.followUpRequired,
        follow_up_notes: completionData.followUpRequired ? completionData.followUpNotes : undefined,
        selectedTaskIds: Array.from(selectedTaskIds),
      });

      toast({
        title: "Project voltooid! ✅",
        description: "Het project is succesvol opgeleverd",
      });

      setShowCompletionDialog(false);
      setIsOpen(false);
      setSelectedTaskIds(new Set());
      onCompletionChange?.();
    } catch (error) {
      console.error('Completion error:', error);
      toast({
        title: "Fout bij oplevering",
        description: "Er ging iets mis bij het voltooien van het project",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setCompletionData({
      workPerformed: '',
      materialsUsed: '',
      recommendations: '',
      notes: '',
      customerSatisfaction: 5,
      customerName: customerName,
      customerSignature: '',
      installerSignature: '',
      followUpRequired: false,
      followUpNotes: ''
    });
    setSelectedTaskIds(new Set());
  };

  if (isCompleted) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">Project Opgeleverd</h3>
              <p className="text-sm text-green-600">Dit project is succesvol voltooid</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-orange-200 bg-orange-50/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-orange-100/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-800">Project Oplevering</CardTitle>
                    <p className="text-sm text-orange-600">Klik om project op te leveren</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    Klaar voor oplevering
                  </Badge>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>Zorg ervoor dat alle taken zijn voltooid voordat je het project oplevert</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowCompletionDialog(true)}
                    className="flex-1"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Project Opleveren
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Completion Sheet - Slide-out Sidebar */}
      <Sheet open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Project Oplevering - {projectName}</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            {/* Work Performed */}
            <div>
              <Label htmlFor="workPerformed">Uitgevoerde Werkzaamheden *</Label>
              <Textarea
                id="workPerformed"
                value={completionData.workPerformed}
                onChange={(e) => setCompletionData(prev => ({ ...prev, workPerformed: e.target.value }))}
                placeholder="Beschrijf wat er is uitgevoerd..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Materials Used */}
            <div>
              <Label htmlFor="materialsUsed">Gebruikte Materialen</Label>
              <Textarea
                id="materialsUsed"
                value={completionData.materialsUsed}
                onChange={(e) => setCompletionData(prev => ({ ...prev, materialsUsed: e.target.value }))}
                placeholder="Welke materialen zijn gebruikt..."
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Customer Satisfaction */}
            <div>
              <Label>Klanttevredenheid: {completionData.customerSatisfaction}/5</Label>
              <div className="mt-2 space-y-2">
                <Slider
                  value={[completionData.customerSatisfaction]}
                  onValueChange={([value]) => setCompletionData(prev => ({ ...prev, customerSatisfaction: value }))}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Zeer ontevreden</span>
                  <span>Zeer tevreden</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <Label htmlFor="recommendations">Aanbevelingen</Label>
              <Textarea
                id="recommendations"
                value={completionData.recommendations}
                onChange={(e) => setCompletionData(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Eventuele aanbevelingen voor de klant..."
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Task Selection */}
            {completedTasks.length > 0 && (
              <div>
                <Label>Uitgevoerde werkzaamheden voor werkbon</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecteer welke taken op de werkbon moeten komen.
                </p>
                <Card className="border-dashed">
                  <CardContent className="pt-4 space-y-3 max-h-64 overflow-y-auto">
                    {Object.entries(tasksByBlock).map(([blockTitle, tasks]) => {
                      const blockCompletedTasks = tasks.filter(task => !task.is_info_block && task.is_completed);
                      if (blockCompletedTasks.length === 0) return null;

                      return (
                        <div key={blockTitle} className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">{blockTitle}</h4>
                          {blockCompletedTasks.map((task) => (
                            <div key={task.id} className="flex items-start gap-3 ml-2">
                              <Checkbox
                                id={`task-${task.id}`}
                                checked={selectedTaskIds.has(task.id)}
                                onCheckedChange={(checked) => handleTaskSelection(task.id, !!checked)}
                              />
                              <Label 
                                htmlFor={`task-${task.id}`} 
                                className="text-sm cursor-pointer flex-1"
                              >
                                {task.task_description}
                              </Label>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Follow-up */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="followUpRequired"
                  checked={completionData.followUpRequired}
                  onCheckedChange={(checked) => setCompletionData(prev => ({ ...prev, followUpRequired: !!checked }))}
                />
                <Label htmlFor="followUpRequired">Nakoming vereist</Label>
              </div>
              
              {completionData.followUpRequired && (
                <div>
                  <Label htmlFor="followUpNotes">Nakoming Details</Label>
                  <Textarea
                    id="followUpNotes"
                    value={completionData.followUpNotes}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                    placeholder="Wat moet er nog gebeuren..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="space-y-4">
              <div>
                <Label>Klant Handtekening *</Label>
                <div className="mt-2 border rounded-lg p-4">
                  <SignatureCanvas
                    onSignature={(signature) => setCompletionData(prev => ({ ...prev, customerSignature: signature }))}
                    height={120}
                  />
                </div>
              </div>

              <div>
                <Label>Monteur Handtekening *</Label>
                <div className="mt-2 border rounded-lg p-4">
                  <SignatureCanvas
                    onSignature={(signature) => setCompletionData(prev => ({ ...prev, installerSignature: signature }))}
                    height={120}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCompletionDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button 
                onClick={handleCompleteProject}
                disabled={isCompleting || !completionData.workPerformed.trim() || !completionData.customerSignature || !completionData.installerSignature}
                className="flex-1"
              >
                {isCompleting ? "Opleveren..." : "Project Opleveren"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
