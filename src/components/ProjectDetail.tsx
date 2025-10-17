// Force cache invalidation
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Users, Calendar, Euro, Mail, Phone, User, MapPin, Clock, CheckCircle2, CheckCircle, Circle, Edit, FileText, Camera, Receipt, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ProjectMaterials } from "./ProjectMaterials";
import { ProjectPersonnel } from "./ProjectPersonnel";
import { ProjectActivities } from "./ProjectActivities";
import { ProjectTasks } from "./ProjectTasks";
import { ProjectDeliveryDialog } from "./dashboard/ProjectDeliveryDialog";
import { WorkOrderPreviewDialog } from "./workorders/WorkOrderPreviewDialog";
import { ProjectReceiptUpload } from "./ProjectReceiptUpload";
import { ProjectPhotoUpload } from "./ProjectPhotoUpload";
import { ProjectCompletionPanel } from "./dashboard/ProjectCompletionPanel";

interface PhotoGroup {
  id: string;
  title: string;
  photos: any[];
}

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, customers } = useCrmStore();
  const { profile, user } = useAuth();
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPersonnel, setShowPersonnel] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any | null>(null);
  const [workOrderPreviewOpen, setWorkOrderPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      setLoadingData(true);
      try {
        // 1. Fetch main project data and customer
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*, customer:customers(*)')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);
        setCustomer(projectData.customer);

        // 2. Fetch all related data in parallel
        const [
          tasksResult,
          invoicesResult,
          quotesResult,
          workOrdersResult,
          receiptsResult,
          projectPhotosResult,
        ] = await Promise.all([
          supabase.from('project_tasks').select('*').eq('project_id', projectId),
          supabase.from('invoices').select('*').eq('project_id', projectId),
          supabase.from('quotes').select('*').eq('project_id', projectId),
          supabase.from('project_work_orders').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
          supabase.from('project_receipts').select('*').eq('project_id', projectId),
          supabase.from('project_photos').select('*, work_order:project_work_orders(id, work_order_number)').eq('project_id', projectId),
        ]);

        // Set state for parallel fetches
        setTasks(tasksResult.data || []);
        setInvoices(invoicesResult.data || []);
        setQuotes(quotesResult.data || []);
        setWorkOrders(workOrdersResult.data || []);
        setReceipts(receiptsResult.data || []);

        // 3. Fetch all photos related to the project (both legacy project_photos and completion_photos linked to work orders)
        const workOrders = workOrdersResult.data || [];
        const completionIds = workOrders.map((w: any) => w.completion_id).filter((id: string | null) => !!id);
        const completionIdToWorkOrder: Record<string, { id: string; number: string | null }> = Object.fromEntries(
          workOrders
            .filter((w: any) => !!w.completion_id)
            .map((w: any) => [w.completion_id as string, { id: w.id as string, number: w.work_order_number as string | null }])
        );

        let completionPhotos: any[] = [];
        if (completionIds.length > 0) {
          const { data: cPhotos, error: cPhotosErr } = await supabase
            .from('completion_photos')
            .select('id, completion_id, photo_url, description, category, uploaded_at')
            .in('completion_id', completionIds as string[]);
          if (cPhotosErr) console.warn('Could not load completion photos:', cPhotosErr.message);
          completionPhotos = cPhotos || [];
        }

        // Legacy project photos already fetched
        const allProjectPhotos = projectPhotosResult.data || [];

        // 4. Group photos for the UI (by work order; include both sources)
        const groups: PhotoGroup[] = [];
        const byGroup: Record<string, PhotoGroup> = {};

        // Helper to get/create group
        const ensureGroup = (groupId: string, title: string) => {
          if (!byGroup[groupId]) {
            byGroup[groupId] = { id: groupId, title, photos: [] } as PhotoGroup;
          }
          return byGroup[groupId];
        };

        // a) completion_photos grouped by their work order via completion_id
        for (const cp of completionPhotos) {
          const wo = completionIdToWorkOrder[cp.completion_id];
          const groupId = wo ? wo.id : 'general';
          const title = wo && wo.number ? `Werkbon ${wo.number}` : 'Algemene Projectfoto\'s';
          const group = ensureGroup(groupId, title);
          group.photos.push({
            id: cp.id,
            photo_url: cp.photo_url,
            description: cp.description,
          });
        }

        // b) existing project_photos grouped by optional work_order
        for (const p of allProjectPhotos) {
          const groupId = p.work_order?.id || 'general';
          const title = p.work_order ? `Werkbon ${p.work_order.work_order_number}` : 'Algemene Projectfoto\'s';
          const group = ensureGroup(groupId, title);
          group.photos.push(p);
        }

        const sortedGroups = Object.values(byGroup).sort((a, b) => {
          if (a.id === 'general') return -1;
          if (b.id === 'general') return 1;
          return a.title.localeCompare(b.title);
        });
        
        setPhotoGroups(sortedGroups);

      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  // Handle task completion toggle
  const handleTaskToggle = async (taskId: string, currentCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ 
          is_completed: !currentCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Refresh tasks
      const { data: taskData } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      setTasks(taskData || []);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (!project) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>
        <div className="mt-6">
          <h2 className="text-2xl font-bold">Project niet gevonden</h2>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'te-plannen': { label: 'Te plannen', variant: 'secondary' },
      'gepland': { label: 'Gepland', variant: 'default' },
      'in_progress': { label: 'In uitvoering', variant: 'default' },
      'voltooid': { label: 'Voltooid', variant: 'outline' },
      'afgerond': { label: 'Afgerond', variant: 'outline' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '€0';
    return `€${amount.toLocaleString('nl-NL')}`;
  };

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Project Overzicht</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT COLUMN - Project info, Customer info, Financial */}
          <div className="lg:col-span-2 space-y-4">
            {/* Projectgegevens */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Projectgegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Projectnaam</p>
                    <p className="font-medium">{project.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(project.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Startdatum</p>
                    <p className="font-medium">{project.date ? format(new Date(project.date), 'dd-MM-yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-medium">{project.date ? format(new Date(project.date), 'dd-MM-yyyy') : '-'}</p>
                  </div>
                </div>
                {project.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Beschrijving</p>
                    <p className="text-sm mt-1">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Klantgegevens */}
            {customer && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Klantgegevens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Klantnaam</p>
                      <p className="font-medium">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contactpersoon</p>
                      <p className="font-medium">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </p>
                      <a href={`mailto:${customer.email}`} className="text-sm text-primary hover:underline">
                        {customer.email}
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Telefoon
                      </p>
                      <a href={`tel:${customer.phone}`} className="text-sm text-primary hover:underline">
                        {customer.phone}
                      </a>
                    </div>
                  </div>
                  {customer.address && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Adres
                      </p>
                      <p className="text-sm">{customer.address}</p>
                      {customer.city && <p className="text-sm">{customer.city}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financieel overzicht - 🔒 NIET voor Installateurs */}
            {profile?.role !== 'Installateur' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Financieel overzicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Gebudgetteerd</p>
                      <p className="text-2xl font-bold text-gray-700">{formatCurrency(project.value)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gefactureerd</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total_amount || inv.total || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Resterend</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency((project.value || 0) - invoices.reduce((sum, inv) => sum + (inv.total_amount || inv.total || 0), 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN - Details buttons & Activity */}
          <div className="space-y-4">
            {/* Details Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Sheet open={showMaterials} onOpenChange={setShowMaterials}>
                  <SheetTrigger asChild>
                    <Button className="w-full bg-red-700 hover:bg-red-800 text-white">
                      <Package className="mr-2 h-4 w-4" />
                      Materiaal
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Projectmaterialen</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <ProjectMaterials projectId={projectId || ''} />
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet open={showPersonnel} onOpenChange={setShowPersonnel}>
                  <SheetTrigger asChild>
                    <Button className="w-full bg-red-700 hover:bg-red-800 text-white">
                      <Users className="mr-2 h-4 w-4" />
                      Personeel
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Projectpersoneel</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <ProjectPersonnel projectId={projectId || ''} />
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet open={showReceipts} onOpenChange={setShowReceipts}>
                  <SheetTrigger asChild>
                    <Button className="w-full bg-red-700 hover:bg-red-800 text-white">
                      <Receipt className="mr-2 h-4 w-4" />
                      Bonnetjes
                      {receipts.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-white text-red-700">
                          {receipts.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Project Bonnetjes</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      {receipts.length > 0 ? (
                        <div className="space-y-3">
                          {receipts.map((receipt: any) => (
                            <Card key={receipt.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{receipt.description || 'Bonnetje'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      €{receipt.amount?.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(receipt.created_at), 'dd-MM-yyyy HH:mm', { locale: nl })}
                                    </p>
                                  </div>
                                  {receipt.status && (
                                    <Badge 
                                      variant={
                                        receipt.status === 'approved' ? 'default' : 
                                        receipt.status === 'rejected' ? 'destructive' : 
                                        'secondary'
                                      }
                                    >
                                      {receipt.status === 'approved' ? 'Goedgekeurd' :
                                       receipt.status === 'rejected' ? 'Afgekeurd' :
                                       'In behandeling'}
                                    </Badge>
                                  )}
                                </div>
                                {receipt.receipt_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => window.open(receipt.receipt_url, '_blank')}
                                  >
                                    Bekijk bonnetje
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Receipt className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>Nog geen bonnetjes voor dit project</p>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>

            {/* Activiteit - New Component with Database Integration */}
            <ProjectActivities projectId={projectId!} />

            {/* Project Delivery Button */}
            {profile?.role === 'Installateur' && project?.status !== 'afgerond' && (
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={() => setShowDeliveryDialog(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Project Opleveren
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Openstaande taken blijven in de planning staan
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs Section - Full Width */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="taken" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-4">
                <TabsTrigger value="taken" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                  Project taken
                </TabsTrigger>
                
                {/* 📋 Werkbonnen tab - Always visible, Monteurs see ONLY their own work orders */}
                <TabsTrigger value="werkbonnen" className="relative">
                  Werkbonnen
                  {workOrders.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {workOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>                
                {/* 📸 Foto's tab - Always visible, Monteurs see ONLY their own photos */}
                <TabsTrigger value="fotos" className="relative">
                  Foto's
                  {photoGroups.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {profile?.role === 'Installateur' 
                        ? photoGroups.filter((p: PhotoGroup) => p.id === 'general').length 
                        : photoGroups.length}
                    </Badge>
                  )}
                </TabsTrigger>
                
                {/* 🧾 Bonnetjes tab - Always visible */}
                <TabsTrigger value="bonnetjes" className="relative">
                  Bonnetjes
                  {receipts.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {receipts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                
                {/* 🔒 Facturen en Offertes tabs NIET voor Installateurs */}
                {profile?.role !== 'Installateur' && (
                  <>
                    <TabsTrigger value="facturen">Facturen</TabsTrigger>
                    <TabsTrigger value="offertes">Offertes</TabsTrigger>
                  </>
                )}
              </TabsList>

              {profile?.role === 'Installateur' && project?.status !== 'afgerond' && (
                <div className="absolute top-0 right-0 p-2">
                  <Button onClick={() => setShowDeliveryDialog(true)} size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Project Opleveren
                  </Button>
                </div>
              )}

              <TabsContent value="taken" className="p-4">
                <ProjectTasks projectId={projectId || ''} />
              </TabsContent>

              <TabsContent value="werkbonnen" className="p-4">
                {(() => {
                  if (loadingData) return <p className="text-center text-muted-foreground py-8">Laden...</p>;
                  if (workOrders.length === 0) return (
                      <div className="text-center text-muted-foreground py-8">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Geen werkbonnen beschikbaar voor dit project.</p>
                        <p className="text-xs mt-2">Werkbonnen worden aangemaakt na project oplevering</p>
                      </div>
                    );
                  return (
                    <div className="space-y-3">
                      {workOrders.map((workOrder) => (
                      <div key={workOrder.id} className="border rounded-lg p-4 hover:bg-emerald-50/50 transition-colors cursor-pointer" onClick={() => { setSelectedWorkOrder(workOrder); setWorkOrderPreviewOpen(true); }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              <p className="font-semibold text-lg">Werkbon {workOrder.work_order_number}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Ondertekend door: <span className="font-medium text-foreground">{workOrder.client_name}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Datum: {(() => {
                                const ts = (workOrder as any).signed_at || (workOrder as any).created_at;
                                return ts ? format(new Date(ts), 'dd MMM yyyy - HH:mm', { locale: nl }) : 'Onbekend'
                              })()}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                          {workOrder.pdf_url && (
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); window.open(workOrder.pdf_url, '_blank'); }} className="bg-emerald-600 hover:bg-emerald-700">
                              <FileText className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                          )}
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/project/${projectId}/werkbon/${workOrder.id}`); }} variant="outline">
                              <Eye className="h-4 w-4 mr-2" />
                              Bekijk Werkbon
                            </Button>
                          </div>
                        </div>
                        {workOrder.summary_text && (
                          <div className="bg-gray-50 rounded p-3 mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Samenvatting:</p>
                            <p className="text-sm text-gray-600">{workOrder.summary_text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  );
                })()}
              </TabsContent>

              <TabsContent value="fotos" className="p-4">
                <ProjectPhotoUpload projectId={projectId} onUpload={() => { /* TODO: Refresh logic */ }} />
                <div className="space-y-6 mt-6">
                  {photoGroups.length > 0 ? (
                    photoGroups.map(group => (
                      <Card key={group.id}>
                        <CardHeader><CardTitle>{group.title}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="flex overflow-x-auto space-x-4 pb-4">
                            {group.photos.map(photo => (
                              <div key={photo.id} className="flex-shrink-0 w-64">
                                <a href={photo.photo_url} target="_blank" rel="noopener noreferrer">
                                  <img src={photo.photo_url} alt={photo.description || 'Projectfoto'} className="w-full h-40 object-cover rounded-lg border"/>
                                </a>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="flex items-center justify-center h-40"><p>Geen foto's gevonden.</p></Card>
                  )}
                    </div>
              </TabsContent>

              <TabsContent value="bonnetjes" className="p-4">
                <div className="mb-4 flex justify-end">
                  <ProjectReceiptUpload projectId={projectId!} onUploadComplete={async () => { /* ... refresh logic ... */ }} />
                </div>
                {loadingData ? <p>Laden...</p> : receipts.length === 0 ? (
                  <div className="text-center py-8"><p>Geen bonnetjes gevonden.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {receipts.map((receipt) => (
                      <Card key={receipt.id}>{/* ... receipt item details ... */}</Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {profile?.role !== 'Installateur' && (
                <>
              <TabsContent value="facturen" className="p-4">
                    {loadingData ? <p>Laden...</p> : invoices.length === 0 ? (
                      <div className="text-center py-8"><p>Geen facturen gevonden.</p></div>
                ) : (
                  <div className="space-y-2">
                        {invoices.map((invoice) => (
                          <div key={invoice.id}>{/* ... invoice item details ... */}</div>
                        ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="offertes" className="p-4">
                    {loadingData ? <p>Laden...</p> : quotes.length === 0 ? (
                      <div className="text-center py-8"><p>Geen offertes gevonden.</p></div>
                ) : (
                  <div className="space-y-2">
                        {quotes.map((quote) => (
                          <div key={quote.id}>{/* ... quote item details ... */}</div>
                        ))}
                  </div>
                )}
              </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>

      {/* Project Delivery Dialog */}
      <ProjectCompletionPanel
          project={project}
          isOpen={showDeliveryDialog}
          onClose={() => setShowDeliveryDialog(false)}
          onComplete={async () => {
            setShowDeliveryDialog(false);
            // Refetch all project data to update werkbonnen and foto's count
            if (projectId) {
              setLoadingData(true);
              try {
                const [workOrdersResult, projectPhotosResult] = await Promise.all([
                  supabase.from('project_work_orders').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
                  supabase.from('project_photos').select('*, work_order:project_work_orders(id, work_order_number)').eq('project_id', projectId),
                ]);
                setWorkOrders(workOrdersResult.data || []);
                
                // Reload completion photos + group for Foto's tab
                const workOrders = workOrdersResult.data || [];
                const completionIds = workOrders.map((w: any) => w.completion_id).filter((id: string | null) => !!id);
                let completionPhotos: any[] = [];
                if (completionIds.length > 0) {
                  const { data: cPhotos } = await supabase
                    .from('completion_photos')
                    .select('id, completion_id, photo_url, description, category, uploaded_at')
                    .in('completion_id', completionIds as string[]);
                  completionPhotos = cPhotos || [];
                }
                
                const completionIdToWorkOrder: Record<string, { id: string; number: string | null }> = Object.fromEntries(
                  workOrders.filter((w: any) => !!w.completion_id).map((w: any) => [w.completion_id as string, { id: w.id as string, number: w.work_order_number as string | null }])
                );
                
                const byGroup: Record<string, any> = {};
                const ensureGroup = (groupId: string, title: string) => {
                  if (!byGroup[groupId]) byGroup[groupId] = { id: groupId, title, photos: [] };
                  return byGroup[groupId];
                };
                
                for (const cp of completionPhotos) {
                  const wo = completionIdToWorkOrder[cp.completion_id];
                  const groupId = wo ? wo.id : 'general';
                  const title = wo && wo.number ? `Werkbon ${wo.number}` : 'Algemene Projectfoto\'s';
                  ensureGroup(groupId, title).photos.push({ id: cp.id, photo_url: cp.photo_url, description: cp.description });
                }
                
                const allProjectPhotos = projectPhotosResult.data || [];
                for (const p of allProjectPhotos) {
                  const groupId = p.work_order?.id || 'general';
                  const title = p.work_order ? `Werkbon ${p.work_order.work_order_number}` : 'Algemene Projectfoto\'s';
                  ensureGroup(groupId, title).photos.push(p);
                }
                
                const sortedGroups = Object.values(byGroup).sort((a: any, b: any) => {
                  if (a.id === 'general') return -1;
                  if (b.id === 'general') return 1;
                  return a.title.localeCompare(b.title);
                });
                setPhotoGroups(sortedGroups);
              } catch (error) {
                console.error("Error refreshing after completion:", error);
              } finally {
                setLoadingData(false);
              }
            }
          }}
        />

      {/* Work Order Preview Dialog */}
      <WorkOrderPreviewDialog
        open={workOrderPreviewOpen}
        onOpenChange={setWorkOrderPreviewOpen}
        workOrder={selectedWorkOrder}
      />
    </div>
    </div>
  );
};

export default ProjectDetail;
