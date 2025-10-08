import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  Pause, 
  Play,
  StopCircle,
  Camera,
  Package,
  FileText,
  Loader2,
  X,
  Check,
  Plus
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInSeconds } from 'date-fns';

interface ProjectWorkTrackingProps {
  workTimeLogId: string;
  onComplete?: () => void;
}

interface Task {
  id: string;
  description: string;
  completed: boolean;
}

interface Photo {
  id: string;
  url: string;
  type: 'before' | 'during' | 'after' | 'detail';
  caption?: string;
  uploaded_at: string;
}

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  notes?: string;
}

export function ProjectWorkTracking({ workTimeLogId, onComplete }: ProjectWorkTrackingProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [workTimeLog, setWorkTimeLog] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  
  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  
  // Photos
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<'before' | 'during' | 'after' | 'detail'>('during');
  
  // Materials
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    quantity: 1,
    unit: 'stuks',
    price: 0,
    notes: ''
  });
  
  // Notes
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchWorkData();
  }, [workTimeLogId]);

  // Timer effect
  useEffect(() => {
    if (!workTimeLog || isPaused) return;

    const interval = setInterval(() => {
      const startTime = new Date(workTimeLog.start_time);
      const now = new Date();
      
      // Calculate total pause time
      let totalPauseSeconds = 0;
      if (workTimeLog.pause_duration_seconds) {
        totalPauseSeconds = workTimeLog.pause_duration_seconds;
      }
      
      const elapsed = differenceInSeconds(now, startTime) - totalPauseSeconds;
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [workTimeLog, isPaused]);

  const fetchWorkData = async () => {
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
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', logData.project_id)
          .single();

        if (!projectError) {
          setProject(projectData);
          
          // Load tasks from project_tasks if exists
          const { data: tasksData } = await supabase
            .from('project_tasks')
            .select('*')
            .eq('project_id', projectData.id)
            .order('created_at');

          if (tasksData) {
            setTasks(tasksData.map(t => ({
              id: t.id,
              description: t.description,
              completed: t.completed || false
            })));
          }
        }
      }

      // Fetch photos
      const { data: photosData } = await supabase
        .from('work_photos')
        .select('*')
        .eq('work_time_log_id', workTimeLogId)
        .order('uploaded_at');

      if (photosData) {
        setPhotos(photosData);
      }

      // Fetch materials
      const { data: materialsData } = await supabase
        .from('material_usage')
        .select('*')
        .eq('work_time_log_id', workTimeLogId)
        .order('created_at');

      if (materialsData) {
        setMaterials(materialsData.map(m => ({
          id: m.id,
          name: m.material_name,
          quantity: m.quantity_used,
          unit: m.unit || 'stuks',
          price: m.unit_price || 0,
          notes: m.notes || ''
        })));
      }

      // Load notes
      if (logData.notes) {
        setNotes(logData.notes);
      }
    } catch (error) {
      console.error('Error fetching work data:', error);
      toast({
        title: "Fout bij ophalen data",
        description: "Kan werkgegevens niet ophalen.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePause = async () => {
    try {
      if (isPaused) {
        // Resume
        const pauseDuration = pauseStartTime 
          ? differenceInSeconds(new Date(), pauseStartTime)
          : 0;

        const totalPauseDuration = (workTimeLog.pause_duration_seconds || 0) + pauseDuration;

        const { error } = await supabase
          .from('work_time_logs')
          .update({ pause_duration_seconds: totalPauseDuration })
          .eq('id', workTimeLogId);

        if (error) throw error;

        setWorkTimeLog(prev => ({ ...prev, pause_duration_seconds: totalPauseDuration }));
        setIsPaused(false);
        setPauseStartTime(null);

        toast({
          title: "⏯️ Werk hervat",
          description: "Timer loopt weer.",
        });
      } else {
        // Pause
        setIsPaused(true);
        setPauseStartTime(new Date());

        toast({
          title: "⏸️ Pauze gestart",
          description: "Timer gepauzeerd.",
        });
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast({
        title: "Fout",
        description: "Kan pauze niet in-/uitschakelen.",
        variant: "destructive"
      });
    }
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;

    try {
      if (project) {
        const { data, error } = await supabase
          .from('project_tasks')
          .insert({
            project_id: project.id,
            description: newTaskText.trim(),
            completed: false
          })
          .select()
          .single();

        if (error) throw error;

        setTasks(prev => [...prev, {
          id: data.id,
          description: data.description,
          completed: false
        }]);
      } else {
        // Local only task
        setTasks(prev => [...prev, {
          id: Date.now().toString(),
          description: newTaskText.trim(),
          completed: false
        }]);
      }

      setNewTaskText('');
      setShowAddTask(false);

      toast({
        title: "✅ Taak toegevoegd",
        description: "Taak is toegevoegd aan de lijst.",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Fout",
        description: "Kan taak niet toevoegen.",
        variant: "destructive"
      });
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newCompleted = !task.completed;

      if (project) {
        const { error } = await supabase
          .from('project_tasks')
          .update({ completed: newCompleted })
          .eq('id', taskId);

        if (error) throw error;
      }

      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed: newCompleted } : t
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Bestand te groot",
        description: "Maximale bestandsgrootte is 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingPhoto(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${workTimeLogId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('work-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('work-photos')
        .getPublicUrl(fileName);

      // Save to database
      const { data: photoData, error: photoError } = await supabase
        .from('work_photos')
        .insert({
          work_time_log_id: workTimeLogId,
          project_id: project?.id,
          url: publicUrl,
          type: selectedPhotoType,
          uploaded_by: user?.id
        })
        .select()
        .single();

      if (photoError) throw photoError;

      setPhotos(prev => [...prev, {
        id: photoData.id,
        url: publicUrl,
        type: selectedPhotoType,
        uploaded_at: photoData.uploaded_at
      }]);

      toast({
        title: "✅ Foto geüpload",
        description: "Foto is succesvol toegevoegd.",
      });

      setShowPhotoDialog(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Fout bij uploaden",
        description: "Kan foto niet uploaden.",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addMaterial = async () => {
    if (!newMaterial.name.trim()) {
      toast({
        title: "Materiaal naam vereist",
        description: "Vul een materiaal naam in.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('material_usage')
        .insert({
          work_time_log_id: workTimeLogId,
          project_id: project?.id,
          material_name: newMaterial.name,
          quantity_used: newMaterial.quantity,
          unit: newMaterial.unit,
          unit_price: newMaterial.price,
          notes: newMaterial.notes,
          used_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setMaterials(prev => [...prev, {
        id: data.id,
        name: newMaterial.name,
        quantity: newMaterial.quantity,
        unit: newMaterial.unit,
        price: newMaterial.price,
        notes: newMaterial.notes
      }]);

      setNewMaterial({
        name: '',
        quantity: 1,
        unit: 'stuks',
        price: 0,
        notes: ''
      });
      setShowAddMaterial(false);

      toast({
        title: "✅ Materiaal toegevoegd",
        description: `${newMaterial.quantity} ${newMaterial.unit} ${newMaterial.name} toegevoegd.`,
      });
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: "Fout",
        description: "Kan materiaal niet toevoegen.",
        variant: "destructive"
      });
    }
  };

  const saveNotes = async () => {
    try {
      const { error } = await supabase
        .from('work_time_logs')
        .update({ notes })
        .eq('id', workTimeLogId);

      if (error) throw error;

      toast({
        title: "✅ Notities opgeslagen",
        description: "Je notities zijn opgeslagen.",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Fout",
        description: "Kan notities niet opslaan.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Timer Card - Sticky */}
      <Card className="sticky top-0 z-10 shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className={`text-5xl font-bold mb-4 ${isPaused ? 'text-yellow-600' : 'text-green-600'}`}>
              {formatTime(elapsedSeconds)}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={togglePause}
                variant={isPaused ? "default" : "outline"}
                size="lg"
              >
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Hervatten
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pauzeren
                  </>
                )}
              </Button>
              <Button
                onClick={onComplete}
                variant="destructive"
                size="lg"
              >
                <StopCircle className="h-5 w-5 mr-2" />
                Afronden
              </Button>
            </div>
            {isPaused && (
              <Badge className="mt-3 bg-yellow-600">⏸️ Gepauzeerd</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">
            <FileText className="h-4 w-4 mr-2" />
            Taken ({tasks.filter(t => t.completed).length}/{tasks.length})
          </TabsTrigger>
          <TabsTrigger value="photos">
            <Camera className="h-4 w-4 mr-2" />
            Foto's ({photos.length})
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Package className="h-4 w-4 mr-2" />
            Materiaal ({materials.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notities
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Taken Checklist</CardTitle>
                <Button onClick={() => setShowAddTask(!showAddTask)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Taak Toevoegen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddTask && (
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Beschrijving van de taak..."
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  />
                  <Button onClick={addTask}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTask(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {tasks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nog geen taken toegevoegd.
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                    <span className={task.completed ? 'line-through text-gray-500' : ''}>
                      {task.description}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Werk Foto's</CardTitle>
                <Button onClick={() => setShowPhotoDialog(true)}>
                  <Camera className="h-4 w-4 mr-2" />
                  Foto Toevoegen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.type}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Badge className="absolute top-2 left-2">
                      {photo.type}
                    </Badge>
                  </div>
                ))}
              </div>
              {photos.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Nog geen foto's toegevoegd.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gebruikte Materialen</CardTitle>
                <Button onClick={() => setShowAddMaterial(!showAddMaterial)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Materiaal Toevoegen
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddMaterial && (
                <div className="border rounded-lg p-4 space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Materiaal Naam *</Label>
                      <Input
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Bijv: PV Paneel 400W"
                      />
                    </div>
                    <div>
                      <Label>Hoeveelheid *</Label>
                      <Input
                        type="number"
                        value={newMaterial.quantity}
                        onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Eenheid</Label>
                      <Input
                        value={newMaterial.unit}
                        onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="stuks, m, kg, ..."
                      />
                    </div>
                    <div>
                      <Label>Prijs per eenheid (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newMaterial.price}
                        onChange={(e) => setNewMaterial(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notities</Label>
                    <Textarea
                      value={newMaterial.notes}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Extra informatie..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addMaterial} className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      Toevoegen
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddMaterial(false)}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}

              {materials.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nog geen materialen toegevoegd.
                </p>
              ) : (
                materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{material.name}</p>
                      <p className="text-sm text-gray-600">
                        {material.quantity} {material.unit}
                        {material.price > 0 && ` × €${material.price.toFixed(2)} = €${(material.quantity * material.price).toFixed(2)}`}
                      </p>
                      {material.notes && (
                        <p className="text-xs text-gray-500 mt-1">{material.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              )}

              {materials.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="font-semibold">Totale Materiaalkosten:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    €{materials.reduce((sum, m) => sum + (m.quantity * (m.price || 0)), 0).toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Werk Notities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Maak hier notities tijdens je werk..."
                rows={10}
              />
              <Button onClick={saveNotes} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Notities Opslaan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto Toevoegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Foto Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['before', 'during', 'after', 'detail'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={selectedPhotoType === type ? "default" : "outline"}
                    onClick={() => setSelectedPhotoType(type)}
                  >
                    {type === 'before' && '📷 Voor'}
                    {type === 'during' && '🔨 Tijdens'}
                    {type === 'after' && '✅ Na'}
                    {type === 'detail' && '🔍 Detail'}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="photo-upload">Selecteer Foto (max 5MB)</Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="mt-2"
              />
            </div>

            {uploadingPhoto && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2">Uploaden...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

