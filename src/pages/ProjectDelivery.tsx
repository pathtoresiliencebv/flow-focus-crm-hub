import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Globe, 
  CheckCircle,
  Camera,
  PenTool,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { MobileDeliveryPhotoUpload } from "@/components/mobile/MobileDeliveryPhotoUpload";
import { useProjectDelivery } from "@/hooks/useProjectDelivery";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useDeliveryMetadata } from "@/hooks/useDeliveryMetadata";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const ProjectDelivery = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { projects, customers } = useCrmStore();
  const { completeProject, isCompleting } = useProjectDelivery();
  const { tasksByBlock } = useProjectTasks(projectId || '');
  const metadata = useDeliveryMetadata();

  const project = projects.find(p => p.id === projectId);
  const customer = customers.find(c => c.id === project?.customer_id);

  const [formData, setFormData] = useState({
    clientName: customer?.name || '',
    deliverySummary: '',
    deliveryPhotos: [] as string[],
    clientSignature: '',
    monteurSignature: '',
    selectedTasks: new Set<string>()
  });

  // Auto-fill customer name when customer data loads
  useEffect(() => {
    if (customer?.name && !formData.clientName) {
      setFormData(prev => ({ ...prev, clientName: customer.name }));
    }
  }, [customer]);

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
        title: "Naam verplicht",
        description: "Vul de naam van de klant in",
        variant: "destructive"
      });
      return;
    }

    if (!formData.deliverySummary.trim()) {
      toast({
        title: "Samenvatting verplicht",
        description: "Vul een samenvatting van de oplevering in",
        variant: "destructive"
      });
      return;
    }

    if (!formData.clientSignature || !formData.monteurSignature) {
      toast({
        title: "Handtekeningen verplicht",
        description: "Zowel klant als monteur moeten tekenen",
        variant: "destructive"
      });
      return;
    }

    try {
      const deliveryData = {
        project_id: projectId!,
        client_name: formData.clientName,
        delivery_summary: formData.deliverySummary,
        client_signature_data: formData.clientSignature,
        monteur_signature_data: formData.monteurSignature,
        delivery_photos: formData.deliveryPhotos,
        selected_tasks: Array.from(formData.selectedTasks),
        metadata: {
          timestamp: metadata.timestamp,
          location: metadata.location,
          ip_address: metadata.ipAddress
        }
      };

      await completeProject(deliveryData);
      
      toast({
        title: "✅ Project Opgeleverd!",
        description: "Het project is succesvol opgeleverd aan de klant",
      });

      // Navigate back to project
      navigate(`/projects/${projectId}`);
    } catch (error) {
      toast({
        title: "Fout bij opleveren",
        description: "Er ging iets mis bij het opleveren van het project",
        variant: "destructive"
      });
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Project laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground shadow-lg">
        <div className="container max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/projects/${projectId}`)}
            className="mb-4 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar project
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Project Opleveren</h1>
            <p className="text-primary-foreground/90 text-sm sm:text-base">{project.title}</p>
          </div>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="bg-card border-b shadow-sm">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          {metadata.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Metadata laden...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">{metadata.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{metadata.time}</span>
              </div>
              {metadata.location ? (
                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium truncate" title={metadata.location.address || undefined}>
                    {metadata.location.address || 'Locatie vastgelegd'}
                  </span>
                </div>
              ) : metadata.error ? (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-muted-foreground">{metadata.error}</span>
                </div>
              ) : null}
              {metadata.ipAddress && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">{metadata.ipAddress}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Klant Gegevens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientName" className="text-base">
                  Naam klant *
                </Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Voor- en achternaam van de klant"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="deliverySummary" className="text-base">
                  Samenvatting oplevering *
                </Label>
                <Textarea
                  id="deliverySummary"
                  value={formData.deliverySummary}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliverySummary: e.target.value }))}
                  placeholder="Beschrijf wat er is opgeleverd en eventuele bijzonderheden"
                  rows={6}
                  className="mt-2 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Geef een duidelijke beschrijving van de uitgevoerde werkzaamheden
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Task Selection for Work Order */}
          {completedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Uitgevoerde werkzaamheden voor werkbon
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecteer welke taken op de werkbon moeten komen
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {completedTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={formData.selectedTasks.has(task.id)}
                        onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                      />
                      <Label
                        htmlFor={`task-${task.id}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {task.title}
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                      </Label>
                      <Badge variant="outline" className="ml-auto">
                        Voltooid
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Opleverfoto's
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Maak foto's van het opgeleverde werk of upload ze vanuit uw galerij
              </p>
            </CardHeader>
            <CardContent>
              <MobileDeliveryPhotoUpload 
                onPhotosChange={(photos) => setFormData(prev => ({ ...prev, deliveryPhotos: photos }))}
                maxPhotos={10}
              />
            </CardContent>
          </Card>

          {/* Signatures */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Signature */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Klant Handtekening *
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Vraag de klant om hier te tekenen ter bevestiging van de oplevering
                </p>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-2 bg-white">
                  <SignatureCanvas
                    onSignature={(sig) => setFormData(prev => ({ ...prev, clientSignature: sig }))}
                    title="Teken hier"
                  />
                </div>
                {formData.clientSignature && (
                  <p className="text-sm text-green-600 flex items-center gap-2 mt-3">
                    <CheckCircle className="h-4 w-4" />
                    Klant handtekening vastgelegd
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Monteur Signature */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Monteur Handtekening *
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Zet uw handtekening als monteur ter bevestiging van de oplevering
                </p>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-2 bg-white">
                  <SignatureCanvas
                    onSignature={(sig) => setFormData(prev => ({ ...prev, monteurSignature: sig }))}
                    title="Teken hier"
                  />
                </div>
                {formData.monteurSignature && (
                  <p className="text-sm text-green-600 flex items-center gap-2 mt-3">
                    <CheckCircle className="h-4 w-4" />
                    Monteur handtekening vastgelegd
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/projects/${projectId}`)}
                  className="flex-1 sm:flex-initial"
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isCompleting || !formData.clientName || !formData.deliverySummary || !formData.clientSignature || !formData.monteurSignature}
                  className="flex-1 sm:flex-initial sm:min-w-64 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Project Opleveren...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Project Opleveren
                    </>
                  )}
                </Button>
              </div>
              {(!formData.clientSignature || !formData.monteurSignature) && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  ⚠️ Beide handtekeningen zijn verplicht om het project op te leveren
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDelivery;

