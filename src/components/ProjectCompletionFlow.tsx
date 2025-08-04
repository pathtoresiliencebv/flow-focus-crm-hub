import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Camera, 
  Upload, 
  FileText, 
  CheckCircle, 
  X, 
  Download,
  Send,
  Loader2,
  AlertTriangle,
  User,
  Calendar,
  MapPin
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjectCompletion } from '@/hooks/useProjectCompletion';
import { SignatureCapture } from '@/components/mobile/SignatureCapture';

interface ProjectData {
  id: string;
  title: string;
  customer_name: string;
  customer_email: string;
  address: string;
  description?: string;
  status: string;
}

interface CompletionPhoto {
  id: string;
  file: File;
  url: string;
  description: string;
  category: 'before' | 'during' | 'after' | 'detail' | 'overview';
}

interface CompletionData {
  notes: string;
  completion_date: string;
  customer_satisfaction: number;
  work_performed: string;
  materials_used: string;
  recommendations: string;
  customer_signature: string;
  installer_signature: string;
  photos: CompletionPhoto[];
}

interface ProjectCompletionFlowProps {
  project: ProjectData;
  onComplete: (data: CompletionData) => void;
  onCancel: () => void;
}

export const ProjectCompletionFlow: React.FC<ProjectCompletionFlowProps> = ({
  project,
  onComplete,
  onCancel,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { submitCompletion, submitting } = useProjectCompletion(project.id);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [completionData, setCompletionData] = useState<CompletionData>({
    notes: '',
    completion_date: new Date().toISOString().split('T')[0],
    customer_satisfaction: 5,
    work_performed: '',
    materials_used: '',
    recommendations: '',
    customer_signature: '',
    installer_signature: '',
    photos: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const customerSignatureRef = useRef<HTMLCanvasElement>(null);
  const installerSignatureRef = useRef<HTMLCanvasElement>(null);

  const steps = [
    { id: 1, title: 'Project Details', description: 'Complete project information' },
    { id: 2, title: 'Photos', description: 'Upload completion photos' },
    { id: 3, title: 'Signatures', description: 'Customer and installer signatures' },
    { id: 4, title: 'Review', description: 'Review and submit' },
  ];

  // Photo handling
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    try {
      const newPhotos: CompletionPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 10MB`,
            variant: "destructive",
          });
          continue;
        }

        const photoId = `photo_${Date.now()}_${i}`;
        const url = URL.createObjectURL(file);

        newPhotos.push({
          id: photoId,
          file,
          url,
          description: '',
          category: 'after',
        });
      }

      setCompletionData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));

      toast({
        title: "Photos added",
        description: `${newPhotos.length} photo(s) added successfully`,
      });
    } catch (error) {
      console.error('Error handling photos:', error);
      toast({
        title: "Error",
        description: "Failed to process photos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (photoId: string) => {
    setCompletionData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId),
    }));
  };

  const updatePhotoData = (photoId: string, field: keyof CompletionPhoto, value: any) => {
    setCompletionData(prev => ({
      ...prev,
      photos: prev.photos.map(photo =>
        photo.id === photoId ? { ...photo, [field]: value } : photo
      ),
    }));
  };

  // Signature handling
  const initializeSignaturePads = () => {
    // This would initialize signature pad libraries
    // For now, we'll use a simple text input as placeholder
  };

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!completionData.work_performed.trim()) {
          newErrors.work_performed = 'Work performed description is required';
        }
        if (!completionData.completion_date) {
          newErrors.completion_date = 'Completion date is required';
        }
        break;
      case 2:
        if (completionData.photos.length === 0) {
          newErrors.photos = 'At least one photo is required';
        }
        break;
      case 3:
        if (!completionData.customer_signature) {
          newErrors.customer_signature = 'Customer signature is required';
        }
        if (!completionData.installer_signature) {
          newErrors.installer_signature = 'Installer signature is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    const success = await submitCompletion(completionData);
    if (success) {
      onComplete(completionData);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="completion_date">Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={completionData.completion_date}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, completion_date: e.target.value }))}
                />
                {errors.completion_date && (
                  <p className="text-sm text-red-500">{errors.completion_date}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="satisfaction">Customer Satisfaction (1-5)</Label>
                <select
                  id="satisfaction"
                  className="w-full p-2 border rounded-md"
                  value={completionData.customer_satisfaction}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, customer_satisfaction: parseInt(e.target.value) }))}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Below Average</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_performed">Work Performed *</Label>
              <Textarea
                id="work_performed"
                placeholder="Describe the work that was completed..."
                value={completionData.work_performed}
                onChange={(e) => setCompletionData(prev => ({ ...prev, work_performed: e.target.value }))}
                rows={4}
              />
              {errors.work_performed && (
                <p className="text-sm text-red-500">{errors.work_performed}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials_used">Materials Used</Label>
              <Textarea
                id="materials_used"
                placeholder="List materials and products used..."
                value={completionData.materials_used}
                onChange={(e) => setCompletionData(prev => ({ ...prev, materials_used: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                placeholder="Any recommendations for the customer..."
                value={completionData.recommendations}
                onChange={(e) => setCompletionData(prev => ({ ...prev, recommendations: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes or comments..."
                value={completionData.notes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="mb-4"
                size="lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                {loading ? 'Processing...' : 'Add Photos'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Upload photos showing the completed work. Multiple photos can be selected.
              </p>
            </div>

            {errors.photos && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.photos}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completionData.photos.map((photo) => (
                <Card key={photo.id} className="relative">
                  <CardContent className="p-4">
                    <div className="relative">
                      <img
                        src={photo.url}
                        alt="Completion photo"
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removePhoto(photo.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <select
                        value={photo.category}
                        onChange={(e) => updatePhotoData(photo.id, 'category', e.target.value)}
                        className="w-full p-1 text-xs border rounded"
                      >
                        <option value="before">Before</option>
                        <option value="during">During</option>
                        <option value="after">After</option>
                        <option value="detail">Detail</option>
                        <option value="overview">Overview</option>
                      </select>
                      
                      <Input
                        placeholder="Photo description"
                        value={photo.description}
                        onChange={(e) => updatePhotoData(photo.id, 'description', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <SignatureCapture
                  title="Customer Signature"
                  placeholder="Customer signs here"
                  onSignatureChange={(signature) => 
                    setCompletionData(prev => ({ ...prev, customer_signature: signature }))
                  }
                  initialSignature={completionData.customer_signature}
                />
                {errors.customer_signature && (
                  <p className="text-sm text-red-500">{errors.customer_signature}</p>
                )}
              </div>

              <div className="space-y-2">
                <SignatureCapture
                  title="Installer Signature"
                  placeholder="Installer signs here"
                  onSignatureChange={(signature) => 
                    setCompletionData(prev => ({ ...prev, installer_signature: signature }))
                  }
                  initialSignature={completionData.installer_signature}
                />
                {errors.installer_signature && (
                  <p className="text-sm text-red-500">{errors.installer_signature}</p>
                )}
              </div>
            </div>
            
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                Both signatures are required to complete the project. The customer signature confirms their satisfaction with the work performed.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Please review all information before submitting. A completion report will be generated and sent to the customer.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Project:</span>
                    <span>{project.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Customer:</span>
                    <span>{project.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Completion Date:</span>
                    <span>{completionData.completion_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Satisfaction:</span>
                    <Badge variant="outline">
                      {completionData.customer_satisfaction}/5
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Photos:</span>
                    <span>{completionData.photos.length} uploaded</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Complete Project: {project.title}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {project.customer_name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {project.address}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden sm:block w-12 h-0.5 bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < steps.length ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Complete Project
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};