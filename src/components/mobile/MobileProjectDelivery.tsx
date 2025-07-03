import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Camera, PenTool, FileText, ArrowLeft } from "lucide-react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { MobileDeliveryPhotoUpload } from "./MobileDeliveryPhotoUpload";
import { useProjectDelivery } from "@/hooks/useProjectDelivery";
import { Project } from "@/hooks/useCrmStore";

interface MobileProjectDeliveryProps {
  project: Project;
  onBack: () => void;
  onComplete: () => void;
}

export const MobileProjectDelivery: React.FC<MobileProjectDeliveryProps> = ({
  project,
  onBack,
  onComplete
}) => {
  const { completeProject, isCompleting } = useProjectDelivery();
  const [currentStep, setCurrentStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [deliverySummary, setDeliverySummary] = useState('');
  const [deliveryPhotos, setDeliveryPhotos] = useState<string[]>([]);
  const [clientSignature, setClientSignature] = useState('');
  const [monteurSignature, setMonteurSignature] = useState('');

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = async () => {
    if (!clientName.trim() || !deliverySummary.trim() || !clientSignature || !monteurSignature) {
      return;
    }

    const deliveryData = {
      project_id: project.id,
      client_name: clientName,
      delivery_summary: deliverySummary,
      client_signature_data: clientSignature,
      monteur_signature_data: monteurSignature,
      delivery_photos: deliveryPhotos
    };

    await completeProject(deliveryData);
    onComplete();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return clientName.trim() && deliverySummary.trim();
      case 2:
        return true; // Photos are optional
      case 3:
        return clientSignature;
      case 4:
        return monteurSignature;
      default:
        return false;
    }
  };

  const isLastStep = currentStep === 4;
  const stepTitles = [
    "Project Details",
    "Oplevering Foto's",
    "Klant Handtekening", 
    "Monteur Handtekening"
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Terug
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-semibold">Project Oplevering</h1>
          <p className="text-sm text-muted-foreground">{project.title}</p>
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-6">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            {step < 4 && (
              <div
                className={`w-12 h-0.5 mx-2 transition-colors ${
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-medium">{stepTitles[currentStep - 1]}</h2>
        <p className="text-sm text-muted-foreground">Stap {currentStep} van 4</p>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: Project Details */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Gegevens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client-name">Naam klant *</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Voor- en achternaam van de klant"
                />
              </div>

              <div>
                <Label htmlFor="delivery-summary">Samenvatting opgeleverde werkzaamheden *</Label>
                <Textarea
                  id="delivery-summary"
                  value={deliverySummary}
                  onChange={(e) => setDeliverySummary(e.target.value)}
                  placeholder="Beschrijf wat er is opgeleverd..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Photos */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Oplevering Foto's
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Maak foto's van het opgeleverde werk (optioneel)
              </p>
              <MobileDeliveryPhotoUpload 
                onPhotosChange={setDeliveryPhotos}
                maxPhotos={10}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Client Signature */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Klant Handtekening
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Vraag de klant om hier te tekenen ter bevestiging van de oplevering
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
                  Klant handtekening vastgelegd
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Monteur Signature */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Monteur Handtekening
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Zet uw handtekening als monteur ter bevestiging van de oplevering
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
                  Monteur handtekening vastgelegd
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-8 pb-8">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex-1"
        >
          {currentStep === 1 ? 'Annuleren' : 'Vorige'}
        </Button>
        
        {isLastStep ? (
          <Button
            onClick={handleComplete}
            disabled={!canProceed() || isCompleting}
            className="flex-1"
          >
            {isCompleting ? 'Afronden...' : 'Project Opleveren'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            Volgende
          </Button>
        )}
      </div>
    </div>
  );
};