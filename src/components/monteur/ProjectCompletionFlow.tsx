import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Star,
  FileText,
  Loader2,
  Camera,
  Package,
  Clock,
  User
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ProjectCompletionFlowProps {
  workTimeLogId: string;
  onComplete?: (completionId: string) => void;
}

interface CompletionData {
  // Step 1: Work Summary
  workSummary: string;
  workCompleted: boolean;
  
  // Step 2: Photo Control
  photosVerified: boolean;
  beforePhotos: number;
  afterPhotos: number;
  
  // Step 3: Materials Confirmation
  materialsConfirmed: boolean;
  materialNotes: string;
  
  // Step 4: Time Registration
  actualEndTime: string;
  breakDuration: number;
  
  // Step 5: Customer Satisfaction
  satisfaction: 1 | 2 | 3 | 4 | 5;
  satisfactionNotes: string;
  
  // Step 6: Signatures
  customerName: string;
  customerSignature: string;
  monteurSignature: string;
  
  // Step 7: Additional Notes
  recommendations: string;
  followUpRequired: boolean;
  followUpNotes: string;
}

export function ProjectCompletionFlow({ workTimeLogId, onComplete }: ProjectCompletionFlowProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [workTimeLog, setWorkTimeLog] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  
  const [completionData, setCompletionData] = useState<CompletionData>({
    workSummary: '',
    workCompleted: true,
    photosVerified: false,
    beforePhotos: 0,
    afterPhotos: 0,
    materialsConfirmed: false,
    materialNotes: '',
    actualEndTime: format(new Date(), 'HH:mm'),
    breakDuration: 0,
    satisfaction: 5,
    satisfactionNotes: '',
    customerName: '',
    customerSignature: '',
    monteurSignature: '',
    recommendations: '',
    followUpRequired: false,
    followUpNotes: ''
  });

  useEffect(() => {
    fetchData();
  }, [workTimeLogId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch work time log
      const { data: logData, error: logError } = await supabase
        .from('work_time_logs')
        .select('*')
        .eq('id', workTimeLogId)
        .single();

      if (logError) throw logError;
      setWorkTimeLog(logData);

      // Fetch project
      if (logData.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', logData.project_id)
          .single();

        if (projectData) {
          setProject(projectData);

          // Fetch tasks
          const { data: tasksData } = await supabase
            .from('project_tasks')
            .select('*')
            .eq('project_id', projectData.id);

          if (tasksData) setTasks(tasksData);
        }
      }

      // Fetch customer
      if (logData.planning_id) {
        const { data: planningData } = await supabase
          .from('planning_items')
          .select('customer_id')
          .eq('id', logData.planning_id)
          .single();

        if (planningData?.customer_id) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', planningData.customer_id)
            .single();

          if (customerData) {
            setCustomer(customerData);
            setCompletionData(prev => ({ ...prev, customerName: customerData.name }));
          }
        }
      }

      // Fetch photos
      const { data: photosData } = await supabase
        .from('work_photos')
        .select('*')
        .eq('work_time_log_id', workTimeLogId);

      if (photosData) {
        setPhotos(photosData);
        const before = photosData.filter(p => p.type === 'before').length;
        const after = photosData.filter(p => p.type === 'after').length;
        setCompletionData(prev => ({
          ...prev,
          beforePhotos: before,
          afterPhotos: after,
          photosVerified: before > 0 && after > 0
        }));
      }

      // Fetch materials
      const { data: materialsData } = await supabase
        .from('material_usage')
        .select('*')
        .eq('work_time_log_id', workTimeLogId);

      if (materialsData) setMaterials(materialsData);

      // Calculate break duration
      if (logData.pause_duration_seconds) {
        setCompletionData(prev => ({
          ...prev,
          breakDuration: Math.round(logData.pause_duration_seconds / 60)
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Fout bij ophalen data",
        description: "Kan project gegevens niet ophalen.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validation per step
    if (step === 1 && !completionData.workSummary.trim()) {
      toast({
        title: "Werk samenvatting vereist",
        description: "Vul een samenvatting van het uitgevoerde werk in.",
        variant: "destructive"
      });
      return;
    }

    if (step === 2 && !completionData.photosVerified) {
      toast({
        title: "Foto controle vereist",
        description: "Bevestig dat er minimaal 1 voor en 1 na foto is gemaakt.",
        variant: "destructive"
      });
      return;
    }

    if (step === 6) {
      if (!completionData.customerName.trim()) {
        toast({
          title: "Klant naam vereist",
          description: "Vul de naam van de klant in.",
          variant: "destructive"
        });
        return;
      }
      if (!completionData.customerSignature) {
        toast({
          title: "Klant handtekening vereist",
          description: "Vraag de klant om te tekenen.",
          variant: "destructive"
        });
        return;
      }
      if (!completionData.monteurSignature) {
        toast({
          title: "Jouw handtekening vereist",
          description: "Plaats je handtekening om af te ronden.",
          variant: "destructive"
        });
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Calculate actual work duration
      const startTime = new Date(workTimeLog.start_time);
      const endTime = new Date();
      const totalMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
      const workMinutes = totalMinutes - completionData.breakDuration;

      // Create project completion record
      const { data: completionRecord, error: completionError } = await supabase
        .from('project_completions')
        .insert({
          project_id: project?.id,
          work_time_log_id: workTimeLogId,
          completed_by: user?.id,
          completion_date: new Date().toISOString(),
          
          // Work summary
          work_summary: completionData.workSummary,
          work_completed: completionData.workCompleted,
          
          // Photos
          before_photos_count: completionData.beforePhotos,
          after_photos_count: completionData.afterPhotos,
          total_photos_count: photos.length,
          
          // Materials
          materials_confirmed: completionData.materialsConfirmed,
          material_notes: completionData.materialNotes,
          total_material_cost: materials.reduce((sum, m) => sum + ((m.quantity_used || 0) * (m.unit_price || 0)), 0),
          
          // Time
          actual_start_time: workTimeLog.start_time,
          actual_end_time: endTime.toISOString(),
          total_hours: workMinutes / 60,
          break_minutes: completionData.breakDuration,
          
          // Customer satisfaction
          customer_satisfaction_rating: completionData.satisfaction,
          customer_satisfaction_notes: completionData.satisfactionNotes,
          
          // Signatures
          customer_name: completionData.customerName,
          customer_signature_data: completionData.customerSignature,
          monteur_signature_data: completionData.monteurSignature,
          
          // Recommendations
          recommendations: completionData.recommendations,
          follow_up_required: completionData.followUpRequired,
          follow_up_notes: completionData.followUpNotes,
          
          status: 'completed'
        })
        .select()
        .single();

      if (completionError) throw completionError;

      // Update work time log
      const { error: logUpdateError } = await supabase
        .from('work_time_logs')
        .update({
          end_time: endTime.toISOString(),
          status: 'completed',
          total_minutes: workMinutes
        })
        .eq('id', workTimeLogId);

      if (logUpdateError) throw logUpdateError;

      // Update project status
      if (project) {
        const { error: projectUpdateError } = await supabase
          .from('projects')
          .update({ status: 'afgerond' })
          .eq('id', project.id);

        if (projectUpdateError) throw projectUpdateError;
      }

      toast({
        title: "✅ Project Afgerond!",
        description: "Werkbon wordt nu gegenereerd en verstuurd.",
      });

      if (onComplete) {
        onComplete(completionRecord.id);
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast({
        title: "❌ Fout bij afronden",
        description: "Er ging iets mis. Probeer het opnieuw.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 7;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Project Afronden
        </h1>
        <p className="text-gray-600">
          Volg de 7 stappen om je werk af te ronden
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Voortgang</span>
            <Badge variant="outline">Stap {step}/{totalSteps}</Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* STEP 1: Work Summary */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Stap 1: Werk Samenvatting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Beschrijf het uitgevoerde werk *</Label>
              <Textarea
                value={completionData.workSummary}
                onChange={(e) => setCompletionData(prev => ({ ...prev, workSummary: e.target.value }))}
                placeholder="Geef een gedetailleerde beschrijving van het werk dat is uitgevoerd..."
                rows={6}
                className="mt-2"
              />
            </div>

            {tasks.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Voltooide Taken:</h4>
                <ul className="space-y-1">
                  {tasks.filter(t => t.completed).map(task => (
                    <li key={task.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {task.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="workCompleted"
                checked={completionData.workCompleted}
                onChange={(e) => setCompletionData(prev => ({ ...prev, workCompleted: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="workCompleted">
                Ik bevestig dat al het geplande werk is uitgevoerd
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Photo Control */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Stap 2: Foto Controle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={completionData.beforePhotos > 0 && completionData.afterPhotos > 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
              <AlertDescription>
                <strong>Minimum vereist:</strong> 1 voor-foto en 1 na-foto
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-semibold">Voor Foto's</p>
                <p className="text-3xl font-bold text-blue-600">{completionData.beforePhotos}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="font-semibold">Na Foto's</p>
                <p className="text-3xl font-bold text-green-600">{completionData.afterPhotos}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold">Totaal Foto's</p>
              <p className="text-3xl font-bold text-purple-600">{photos.length}</p>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(0, 6).map(photo => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={photo.type}
                    className="w-full h-24 object-cover rounded"
                  />
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="photosVerified"
                checked={completionData.photosVerified}
                onChange={(e) => setCompletionData(prev => ({ ...prev, photosVerified: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="photosVerified">
                Ik bevestig dat alle benodigde foto's zijn gemaakt
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Materials Confirmation */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stap 3: Materiaal Bevestiging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {materials.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Geen materialen geregistreerd voor dit project.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <h4 className="font-semibold">Gebruikte Materialen:</h4>
                {materials.map(material => (
                  <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{material.material_name}</p>
                      <p className="text-sm text-gray-600">
                        {material.quantity_used} {material.unit}
                        {material.unit_price > 0 && ` × €${material.unit_price.toFixed(2)}`}
                      </p>
                    </div>
                    {material.unit_price > 0 && (
                      <p className="font-bold text-blue-600">
                        €{((material.quantity_used || 0) * (material.unit_price || 0)).toFixed(2)}
                      </p>
                    )}
                  </div>
                ))}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold">Totale Materiaalkosten:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    €{materials.reduce((sum, m) => sum + ((m.quantity_used || 0) * (m.unit_price || 0)), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label>Extra Materiaal Notities (optioneel)</Label>
              <Textarea
                value={completionData.materialNotes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, materialNotes: e.target.value }))}
                placeholder="Bijv: Extra materiaal gebruikt, restmateriaal meegenomen, etc..."
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="materialsConfirmed"
                checked={completionData.materialsConfirmed}
                onChange={(e) => setCompletionData(prev => ({ ...prev, materialsConfirmed: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="materialsConfirmed">
                Ik bevestig dat alle gebruikte materialen correct zijn geregistreerd
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Time Registration */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Stap 4: Tijd Registratie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Start Tijd</p>
                <p className="text-2xl font-bold text-blue-600">
                  {format(new Date(workTimeLog.start_time), 'HH:mm')}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Eind Tijd</p>
                <p className="text-2xl font-bold text-green-600">
                  {completionData.actualEndTime}
                </p>
              </div>
            </div>

            <div>
              <Label>Pauze duur (minuten)</Label>
              <Input
                type="number"
                value={completionData.breakDuration}
                onChange={(e) => setCompletionData(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 0 }))}
                className="mt-2"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Totale Werktijd</p>
              <p className="text-3xl font-bold">
                {(() => {
                  const start = new Date(workTimeLog.start_time);
                  const end = new Date();
                  const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
                  const workMinutes = totalMinutes - completionData.breakDuration;
                  const hours = Math.floor(workMinutes / 60);
                  const minutes = workMinutes % 60;
                  return `${hours}u ${minutes}m`;
                })()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Customer Satisfaction */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Stap 5: Klant Tevredenheid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Hoe tevreden is de klant? *</Label>
              <RadioGroup
                value={completionData.satisfaction.toString()}
                onValueChange={(value) => setCompletionData(prev => ({ ...prev, satisfaction: parseInt(value) as 1 | 2 | 3 | 4 | 5 }))}
                className="mt-4"
              >
                <div className="flex justify-between">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label
                      key={rating}
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        completionData.satisfaction === rating
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-300'
                      }`}
                    >
                      <RadioGroupItem value={rating.toString()} className="sr-only" />
                      <div className="flex gap-1">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs font-medium">
                        {rating === 1 && 'Ontevreden'}
                        {rating === 2 && 'Matig'}
                        {rating === 3 && 'Neutraal'}
                        {rating === 4 && 'Tevreden'}
                        {rating === 5 && 'Zeer Tevreden'}
                      </span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Feedback van klant (optioneel)</Label>
              <Textarea
                value={completionData.satisfactionNotes}
                onChange={(e) => setCompletionData(prev => ({ ...prev, satisfactionNotes: e.target.value }))}
                placeholder="Eventuele opmerkingen of feedback van de klant..."
                rows={4}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: Signatures */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Stap 6: Handtekeningen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Naam Klant *</Label>
              <Input
                value={completionData.customerName}
                onChange={(e) => setCompletionData(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="Volledige naam van de klant"
                className="mt-2"
              />
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription>
                <strong>Let op:</strong> In de volledige mobiele app kunnen hier handtekeningen digitaal worden geplaatst.
                Voor nu kun je de naam invullen als bevestiging.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Handtekening Klant *</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Input
                  value={completionData.customerSignature}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, customerSignature: e.target.value }))}
                  placeholder="Typ naam ter bevestiging"
                  className="text-center"
                />
              </div>
            </div>

            <div>
              <Label>Handtekening Monteur *</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Input
                  value={completionData.monteurSignature}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, monteurSignature: e.target.value }))}
                  placeholder="Typ je naam ter bevestiging"
                  className="text-center"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 7: Additional Notes */}
      {step === 7 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Stap 7: Aanbevelingen & Follow-up
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Aanbevelingen voor klant (optioneel)</Label>
              <Textarea
                value={completionData.recommendations}
                onChange={(e) => setCompletionData(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Bijv: Jaarlijks onderhoud, extra voorzieningen, vervolgafspraken..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={completionData.followUpRequired}
                onChange={(e) => setCompletionData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="followUpRequired">
                Er is een follow-up afspraak nodig
              </Label>
            </div>

            {completionData.followUpRequired && (
              <div>
                <Label>Follow-up Notities</Label>
                <Textarea
                  value={completionData.followUpNotes}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                  placeholder="Beschrijf wat er moet gebeuren in de follow-up..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            )}

            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Klaar om af te ronden!</strong> Na bevestiging wordt de werkbon gegenereerd en naar de klant verstuurd.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            {step > 1 && (
              <Button onClick={handleBack} variant="outline" className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Vorige
              </Button>
            )}
            {step < totalSteps ? (
              <Button onClick={handleNext} className="flex-1">
                Volgende
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Werkbon genereren...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Project Afronden
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

