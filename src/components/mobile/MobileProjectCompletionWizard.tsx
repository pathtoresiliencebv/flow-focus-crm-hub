import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Star,
  FileText,
  Camera,
  Smile,
  PenTool,
  Send
} from "lucide-react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { EnhancedPhotoUpload, LocalPhoto } from "./EnhancedPhotoUpload";
import { useProjectCompletion, ProjectCompletionData } from "@/hooks/useProjectCompletion";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/hooks/useCrmStore";

interface MobileProjectCompletionWizardProps {
  project: Project;
  workTimeLogId?: string;
  onBack: () => void;
  onComplete: () => void;
}

const STEPS = [
  { number: 1, title: "Project Info", icon: FileText },
  { number: 2, title: "Voor Foto's", icon: Camera },
  { number: 3, title: "Tijdens Foto's", icon: Camera },
  { number: 4, title: "Na Foto's", icon: Camera },
  { number: 5, title: "Tevredenheid", icon: Smile },
  { number: 6, title: "Handtekeningen", icon: PenTool },
  { number: 7, title: "Afwerking", icon: Send },
];

export const MobileProjectCompletionWizard: React.FC<MobileProjectCompletionWizardProps> = ({
  project,
  workTimeLogId,
  onBack,
  onComplete
}) => {
  const { toast } = useToast();
  const { completeProject, uploadPhoto, generatePDF, isCompleting, isGeneratingPDF } = useProjectCompletion();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [completionId, setCompletionId] = useState<string | null>(null);
  
  // Step 1: Project Info
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  
  // Step 2-4: Photos
  const [beforePhotos, setBeforePhotos] = useState<LocalPhoto[]>([]);
  const [duringPhotos, setDuringPhotos] = useState<LocalPhoto[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<LocalPhoto[]>([]);
  
  // Step 5: Customer Satisfaction
  const [satisfaction, setSatisfaction] = useState<number>(5);
  const [satisfactionNotes, setSatisfactionNotes] = useState('');
  
  // Step 6: Signatures
  const [clientSignature, setClientSignature] = useState('');
  const [monteurSignature, setMonteurSignature] = useState('');
  
  // Step 7: Additional Info
  const [recommendations, setRecommendations] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Auto-fill client info from project
  useEffect(() => {
    if (project.customer) {
      if (project.customer.name && !clientName) {
        setClientName(project.customer.name);
      }
      if (project.customer.email && !clientEmail) {
        setClientEmail(project.customer.email);
      }
    }
  }, [project]);

  /**
   * Validate current step
   */
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return clientName.trim() !== '' && workPerformed.trim() !== '';
      case 2:
        return true; // Before photos are optional
      case 3:
        return true; // During photos are optional
      case 4:
        return true; // After photos are optional (but recommended)
      case 5:
        return satisfaction >= 1 && satisfaction <= 5;
      case 6:
        return clientSignature !== '' && monteurSignature !== '';
      case 7:
        return true; // Final review, everything should be filled
      default:
        return false;
    }
  };

  /**
   * Navigate to next step
   */
  const handleNext = () => {
    if (currentStep < 7 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  /**
   * Upload all photos for a completion
   */
  const uploadAllPhotos = async (completionId: string) => {
    const allPhotos = [
      ...beforePhotos.map(p => ({ ...p, category: 'before' as const })),
      ...duringPhotos.map(p => ({ ...p, category: 'during' as const })),
      ...afterPhotos.map(p => ({ ...p, category: 'after' as const }))
    ];

    const uploadPromises = allPhotos.map(photo =>
      uploadPhoto(
        completionId,
        photo.file,
        photo.category,
        photo.description
      )
    );

    try {
      await Promise.all(uploadPromises);
      toast({
        title: "Foto's geüpload ✅",
        description: `${allPhotos.length} foto's succesvol geüpload`,
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Foto upload fout",
        description: "Sommige foto's konden niet worden geüpload",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Complete the project
   */
  const handleComplete = async () => {
    if (!canProceed()) {
      toast({
        title: "Incomplete gegevens",
        description: "Vul alle verplichte velden in",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create completion record
      const completionData: ProjectCompletionData = {
        project_id: project.id,
        completion_date: new Date().toISOString().split('T')[0],
        work_performed: workPerformed,
        materials_used: materialsUsed || undefined,
        recommendations: recommendations || undefined,
        notes: notes || undefined,
        customer_satisfaction: satisfaction,
        customer_signature: clientSignature,
        installer_signature: monteurSignature,
        customer_name: clientName,
        customer_email: clientEmail || undefined,
        work_time_log_id: workTimeLogId,
        follow_up_required: followUpRequired,
        follow_up_notes: followUpRequired ? followUpNotes : undefined,
      };

      const completion = await completeProject(completionData);
      setCompletionId(completion.id);

      // Upload photos
      const totalPhotos = beforePhotos.length + duringPhotos.length + afterPhotos.length;
      if (totalPhotos > 0) {
        await uploadAllPhotos(completion.id);
      }

      // Generate PDF and send email
      try {
        await generatePDF(completion.id);
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        // Don't fail the whole flow if PDF fails
        toast({
          title: "Werkbon generatie fout",
          description: "Project is opgeleverd, maar werkbon PDF kon niet worden gegenereerd",
          variant: "destructive",
        });
      }

      toast({
        title: "Project voltooid! ✅",
        description: "Het project is succesvol opgeleverd",
      });

      onComplete();
    } catch (error: any) {
      console.error('Completion error:', error);
      toast({
        title: "Fout bij opleveren",
        description: error.message || "Er ging iets mis bij het opleveren van het project",
        variant: "destructive",
      });
    }
  };

  const progress = (currentStep / 7) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-sm font-semibold">Project Oplevering</h1>
              <p className="text-xs text-muted-foreground truncate">{project.title}</p>
            </div>
            <div className="w-20" /> {/* Spacer */}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{STEPS[currentStep - 1].title}</span>
              <span>Stap {currentStep} / 7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-4 space-y-4 pb-24">
        {/* Step 1: Project Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Informatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client-name">Naam klant *</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Voor- en achternaam"
                />
              </div>

              <div>
                <Label htmlFor="client-email">Email klant (optioneel)</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="email@voorbeeld.nl"
                />
              </div>

              <div>
                <Label htmlFor="work-performed">Uitgevoerde werkzaamheden *</Label>
                <Textarea
                  id="work-performed"
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  placeholder="Beschrijf wat er is gedaan..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Beschrijf duidelijk wat er is opgeleverd
                </p>
              </div>

              <div>
                <Label htmlFor="materials-used">Gebruikte materialen (optioneel)</Label>
                <Textarea
                  id="materials-used"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  placeholder="Lijst van gebruikte materialen..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Before Photos */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Voor Foto's
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Maak foto's van de situatie vóór het werk (optioneel)
              </p>
            </CardHeader>
            <CardContent>
              <EnhancedPhotoUpload
                onPhotosChange={setBeforePhotos}
                maxPhotos={10}
                defaultCategory="before"
                showCategorySelector={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 3: During Photos */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Tijdens Werk Foto's
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Maak foto's tijdens de uitvoering (optioneel)
              </p>
            </CardHeader>
            <CardContent>
              <EnhancedPhotoUpload
                onPhotosChange={setDuringPhotos}
                maxPhotos={10}
                defaultCategory="during"
                showCategorySelector={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 4: After Photos */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Na Foto's
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Maak foto's van het afgeronde werk (aanbevolen)
              </p>
            </CardHeader>
            <CardContent>
              <EnhancedPhotoUpload
                onPhotosChange={setAfterPhotos}
                maxPhotos={15}
                defaultCategory="after"
                showCategorySelector={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 5: Customer Satisfaction */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5" />
                Klant Tevredenheid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-4 block">Hoe tevreden is de klant? *</Label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      variant={satisfaction === value ? "default" : "outline"}
                      size="lg"
                      className="w-14 h-14 p-0"
                      onClick={() => setSatisfaction(value)}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          satisfaction >= value ? 'fill-current' : ''
                        }`}
                      />
                    </Button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  {satisfaction === 5 && "Uitstekend! ⭐"}
                  {satisfaction === 4 && "Goed 👍"}
                  {satisfaction === 3 && "Voldoende"}
                  {satisfaction === 2 && "Matig"}
                  {satisfaction === 1 && "Onvoldoende"}
                </p>
              </div>

              <Separator />

              <div>
                <Label htmlFor="satisfaction-notes">Toelichting (optioneel)</Label>
                <Textarea
                  id="satisfaction-notes"
                  value={satisfactionNotes}
                  onChange={(e) => setSatisfactionNotes(e.target.value)}
                  placeholder="Eventuele opmerkingen van de klant..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Signatures */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Klant Handtekening
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Vraag de klant om hier te tekenen ter bevestiging
                </p>
                <div className="border rounded-lg p-2 bg-white">
                  <SignatureCanvas
                    onSignature={setClientSignature}
                    title="Handtekening klant"
                  />
                </div>
                {clientSignature && (
                  <p className="text-sm text-green-600 flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4" />
                    Klant heeft getekend
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Monteur Handtekening
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Zet uw handtekening als monteur
                </p>
                <div className="border rounded-lg p-2 bg-white">
                  <SignatureCanvas
                    onSignature={setMonteurSignature}
                    title="Handtekening monteur"
                  />
                </div>
                {monteurSignature && (
                  <p className="text-sm text-green-600 flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4" />
                    Monteur heeft getekend
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 7: Final Review & Additional Info */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Aanbevelingen & Opmerkingen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recommendations">Aanbevelingen (optioneel)</Label>
                  <Textarea
                    id="recommendations"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Aanbevelingen voor de klant..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Interne notities (optioneel)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Interne opmerkingen..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="follow-up"
                      checked={followUpRequired}
                      onChange={(e) => setFollowUpRequired(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="follow-up" className="cursor-pointer">
                      Opvolging vereist
                    </Label>
                  </div>

                  {followUpRequired && (
                    <Textarea
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      placeholder="Beschrijf wat er moet worden opgevolgd..."
                      rows={2}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-base">Overzicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Klant:</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tevredenheid:</span>
                  <span className="font-medium">{satisfaction}/5 ⭐</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Foto's:</span>
                  <span className="font-medium">
                    {beforePhotos.length + duringPhotos.length + afterPhotos.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Handtekeningen:</span>
                  <span className="font-medium">
                    {clientSignature && monteurSignature ? '✅ Compleet' : '❌ Ontbreekt'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1"
          >
            {currentStep === 1 ? 'Annuleren' : 'Vorige'}
          </Button>
          
          {currentStep === 7 ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || isCompleting || isGeneratingPDF}
              className="flex-1"
            >
              {isCompleting 
                ? 'Opleveren...' 
                : isGeneratingPDF 
                  ? 'PDF genereren...'
                  : 'Project Opleveren'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              Volgende
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

