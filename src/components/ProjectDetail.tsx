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

        // 3. Fetch all photos related to the project
        const { data: allPhotos } = await supabase
          .from('project_photos')
          .select('*, work_order:project_work_orders(id, work_order_number)')
          .eq('project_id', projectId);

        // 4. Group photos for the UI
        const groups: PhotoGroup[] = [];
        const photos = allPhotos || [];
        
        const photosByWorkOrder = photos.reduce((acc, photo) => {
          const workOrderId = photo.work_order?.id || 'general';
          if (!acc[workOrderId]) {
            acc[workOrderId] = {
              id: workOrderId,
              title: photo.work_order ? `Werkbon ${photo.work_order.work_order_number}` : 'Algemene Projectfoto\'s',
              photos: []
            };
          }
          acc[workOrderId].photos.push(photo);
          return acc;
        }, {} as Record<string, PhotoGroup>);

        const sortedGroups = Object.values(photosByWorkOrder).sort((a, b) => {
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
              <div className="absolute top-0 right-0 p-4">
                <Button onClick={() => setShowDeliveryDialog(true)}>
                  Project Opleveren
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>

      {/* Project Delivery Dialog */}
      <ProjectCompletionPanel
        project={project}
        isOpen={showDeliveryDialog}
        onClose={() => setShowDeliveryDialog(false)}
        onComplete={() => {
          setShowDeliveryDialog(false);
          // TODO: Add refresh logic
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
