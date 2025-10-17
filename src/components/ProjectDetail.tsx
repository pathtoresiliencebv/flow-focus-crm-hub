import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Users, Calendar, Euro, Mail, Phone, User, MapPin, Clock, CheckCircle2, CheckCircle, Circle, Edit, FileText, Camera, Receipt } from "lucide-react";
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

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, customers } = useCrmStore();
  const { profile, user } = useAuth();
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPersonnel, setShowPersonnel] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [completionPhotos, setCompletionPhotos] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Find the project
  const project = projects.find(p => p.id === projectId);
  const customer = customers.find(c => c.id === project?.customer_id);

  // Fetch data with parallel queries for better performance
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !project) return;
      
      console.log('📊 ProjectDetail: Fetching data for project:', projectId);
      setLoadingData(true);
      try {
        // Execute all queries in parallel for faster loading
        const [taskResult, invoiceResult, quoteResult, activityResult, workOrderResult, photosResult, receiptsResult] = await Promise.all([
          // Fetch tasks
          supabase
            .from('project_tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false }),
          
          // Fetch invoices - check both project_id and customer_id
          supabase
            .from('invoices')
            .select('*')
            .or(`project_id.eq.${projectId},customer_id.eq.${project.customer_id}`)
            .order('created_at', { ascending: false }),
          
          // Fetch quotes - check both project_id and customer_id
          supabase
            .from('quotes')
            .select('*')
            .or(`project_id.eq.${projectId},customer_id.eq.${project.customer_id}`)
            .order('created_at', { ascending: false }),
          
          // Fetch recent activities
          supabase
            .from('project_tasks')
            .select(`
              id,
              block_title,
              is_completed,
              updated_at
            `)
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false })
            .limit(5),
          
          // Fetch work orders (werkbonnen)
          supabase
            .from('project_work_orders')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false }),
          
          // Fetch completion photos
          supabase
            .from('completion_photos')
            .select(`
              *,
              completion:project_completions!inner(
                installer_id,
                project_id
              )
            `)
            .eq('completion.project_id', projectId)
            .order('uploaded_at', { ascending: false }),
          
          // Fetch project receipts (bonnetjes)
          supabase
            .from('project_receipts')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
        ]);
        
        console.log('📊 ProjectDetail: Data fetched:', {
          tasks: taskResult.data?.length || 0,
          invoices: invoiceResult.data?.length || 0,
          quotes: quoteResult.data?.length || 0,
          workOrders: workOrderResult.data?.length || 0,
          completionPhotos: photosResult.data?.length || 0,
          receipts: receiptsResult.data?.length || 0,
          invoices_data: invoiceResult.data,
          quotes_data: quoteResult.data
        });
        
        console.log('📊 ProjectDetail: Werkbonnen/Foto\'s tab visibility:', {
          werkbonnenWillShow: workOrderResult.data && workOrderResult.data.length > 0,
          fotosWillShow: photosResult.data && photosResult.data.length > 0,
          bonnetjesWillShow: receiptsResult.data && receiptsResult.data.length > 0,
          userRole: profile?.role,
          userId: user?.id
        });
        
        setTasks(taskResult.data || []);
        setInvoices(invoiceResult.data || []);
        setQuotes(quoteResult.data || []);
        setActivities(activityResult.data || []);
        setWorkOrders(workOrderResult.data || []);
        setCompletionPhotos(photosResult.data || []);
        setReceipts(receiptsResult.data || []);
      } catch (error) {
        console.error('❌ Error fetching project data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [projectId, project?.customer_id]);

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
                  {completionPhotos.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {profile?.role === 'Installateur' 
                        ? completionPhotos.filter((p: any) => p.completion?.installer_id === user?.id).length 
                        : completionPhotos.length}
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

              {/* PROJECT TAKEN TAB */}
              <TabsContent value="taken" className="p-4">
                <ProjectTasks projectId={projectId || ''} />
              </TabsContent>

              {/* WERKBONNEN TAB */}
              <TabsContent value="werkbonnen" className="p-4">
                {(() => {
                  // Work orders are always for the current project, no additional filtering needed
                  // Installateurs see work orders for projects they're assigned to (already filtered by project)
                  const filteredWorkOrders = workOrders;
                  
                  if (loadingData) {
                    return <p className="text-center text-muted-foreground py-8">Laden...</p>;
                  }
                  
                  if (filteredWorkOrders.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground py-8">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>
                          {profile?.role === 'Installateur' 
                            ? 'U heeft nog geen werkbonnen gegenereerd voor dit project.'
                            : 'Geen werkbonnen beschikbaar voor dit project.'}
                        </p>
                        <p className="text-xs mt-2">Werkbonnen worden aangemaakt na project oplevering</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {filteredWorkOrders.map((workOrder) => (
                      <div 
                        key={workOrder.id} 
                        className="border rounded-lg p-4 hover:bg-emerald-50/50 transition-colors"
                      >
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
                              Datum: {workOrder.signed_at ? format(new Date(workOrder.signed_at), 'dd MMM yyyy - HH:mm', { locale: nl }) : 'Onbekend'}
                            </p>
                          </div>
                          
                          {workOrder.pdf_url && (
                            <Button
                              size="sm"
                              onClick={() => window.open(workOrder.pdf_url, '_blank')}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Download PDF
                            </Button>
                          )}
                        </div>

                        {/* Summary Text */}
                        {workOrder.summary_text && (
                          <div className="bg-gray-50 rounded p-3 mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Samenvatting werkzaamheden:</p>
                            <p className="text-sm text-gray-600">{workOrder.summary_text}</p>
                          </div>
                        )}

                        {/* Signatures */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {workOrder.client_signature_data && (
                            <div className="border rounded p-2">
                              <p className="text-xs font-medium text-gray-600 mb-1">Handtekening Klant</p>
                              <img 
                                src={workOrder.client_signature_data} 
                                alt="Klant handtekening" 
                                className="w-full h-20 object-contain bg-white"
                              />
                            </div>
                          )}
                          {workOrder.installer_signature_data && (
                            <div className="border rounded p-2">
                              <p className="text-xs font-medium text-gray-600 mb-1">Handtekening Monteur</p>
                              <img 
                                src={workOrder.installer_signature_data} 
                                alt="Monteur handtekening" 
                                className="w-full h-20 object-contain bg-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  );
                })()}
              </TabsContent>

              {/* FOTO'S TAB */}
              <TabsContent value="fotos" className="p-4">
                {(() => {
                  // Filter photos for Installateurs - only show their own
                  const filteredPhotos = profile?.role === 'Installateur'
                    ? completionPhotos.filter((p: any) => p.completion?.installer_id === user?.id)
                    : completionPhotos;
                  
                  if (loadingData) {
                    return <p className="text-center text-muted-foreground py-8">Laden...</p>;
                  }
                  
                  if (filteredPhotos.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>
                          {profile?.role === 'Installateur' 
                            ? 'U heeft nog geen foto\'s gemaakt voor dit project.'
                            : 'Geen foto\'s beschikbaar voor dit project.'}
                        </p>
                      </div>
                    );
                  }
                  
                  // Group photos by category
                  const photosByCategory = filteredPhotos.reduce((acc: any, photo: any) => {
                    const category = photo.category || 'other';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(photo);
                    return acc;
                  }, {});
                  
                  const categoryLabels: Record<string, string> = {
                    before: '📷 Voor Foto\'s',
                    during: '⚙️ Tijdens Werk',
                    after: '✅ Na Foto\'s',
                    detail: '🔍 Detail Foto\'s',
                    overview: '🏠 Overzicht Foto\'s',
                    other: '📸 Overige Foto\'s'
                  };
                  
                  return (
                    <div className="space-y-6">
                      {Object.entries(photosByCategory).map(([category, photos]: [string, any]) => (
                        <div key={category}>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            {categoryLabels[category] || '📸 Foto\'s'}
                            <Badge variant="secondary">{photos.length}</Badge>
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map((photo: any) => (
                              <div 
                                key={photo.id} 
                                className="relative group cursor-pointer"
                                onClick={() => window.open(photo.photo_url, '_blank')}
                              >
                                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors">
                                  <img 
                                    src={photo.photo_url} 
                                    alt={photo.description || category}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                                {photo.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {photo.description}
                                  </p>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Badge variant="secondary" className="bg-white/90 backdrop-blur">
                                    {format(new Date(photo.uploaded_at), 'dd MMM HH:mm', { locale: nl })}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </TabsContent>

              {/* BONNETJES TAB */}
              <TabsContent value="bonnetjes" className="p-4">
                {loadingData ? (
                  <p className="text-center text-muted-foreground py-8">Laden...</p>
                ) : receipts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Geen bonnetjes gevonden voor dit project</p>
                    <p className="text-xs mt-2">Bonnetjes worden toegevoegd via de mobiele app</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {receipts.map((receipt) => (
                      <Card key={receipt.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{receipt.category || 'material'}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {receipt.receipt_date ? format(new Date(receipt.receipt_date), 'dd MMM yyyy', { locale: nl }) : 'Geen datum'}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {receipt.receipt_photo_url && (
                            <img 
                              src={receipt.receipt_photo_url} 
                              alt="Bonnetje" 
                              className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(receipt.receipt_photo_url, '_blank')}
                            />
                          )}
                          <div className="space-y-2">
                            {receipt.supplier && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Leverancier:</span>
                                <span className="font-medium">{receipt.supplier}</span>
                              </div>
                            )}
                            {receipt.total_amount && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Bedrag:</span>
                                <span className="font-bold text-lg">{formatCurrency(receipt.total_amount)}</span>
                              </div>
                            )}
                            {receipt.description && (
                              <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground">{receipt.description}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* FACTUREN TAB */}
              <TabsContent value="facturen" className="p-4">
                {loadingData ? (
                  <p className="text-center text-muted-foreground py-8">Laden...</p>
                ) : invoices.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Geen facturen gevonden voor dit project</p>
                    <p className="text-xs mt-2">Facturen worden automatisch gekoppeld aan het project</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoices.map((invoice) => {
                      const total = invoice.total_amount || invoice.total || 0;
                      return (
                        <div 
                          key={invoice.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          <div className="flex-1">
                            <p className="font-medium">Factuur #{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(invoice.invoice_date || invoice.created_at), 'dd MMM yyyy', { locale: nl })}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <p className="font-bold text-lg">{formatCurrency(total)}</p>
                            <Badge variant={
                              invoice.payment_status === 'paid' || invoice.status === 'paid' 
                                ? 'default' 
                                : invoice.status === 'sent' 
                                ? 'secondary' 
                                : 'outline'
                            }>
                              {invoice.payment_status === 'paid' || invoice.status === 'paid' 
                                ? '✅ Betaald' 
                                : invoice.status === 'sent' 
                                ? '📧 Verzonden' 
                                : '📝 Concept'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* OFFERTES TAB */}
              <TabsContent value="offertes" className="p-4">
                {loadingData ? (
                  <p className="text-center text-muted-foreground py-8">Laden...</p>
                ) : quotes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Geen offertes gevonden voor dit project</p>
                    <p className="text-xs mt-2">Offertes worden automatisch gekoppeld aan het project</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quotes.map((quote) => {
                      const total = quote.total_amount || quote.total || 0;
                      return (
                        <div 
                          key={quote.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/quotes/${quote.id}/preview`)}
                        >
                          <div className="flex-1">
                            <p className="font-medium">Offerte #{quote.quote_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(quote.quote_date || quote.created_at), 'dd MMM yyyy', { locale: nl })}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <p className="font-bold text-lg">{formatCurrency(total)}</p>
                            <Badge variant={
                              quote.status === 'goedgekeurd' 
                                ? 'default' 
                                : quote.status === 'verzonden' 
                                ? 'secondary' 
                                : 'outline'
                            }>
                              {quote.status === 'goedgekeurd' 
                                ? '✅ Goedgekeurd' 
                                : quote.status === 'verzonden' 
                                ? '📧 Verzonden' 
                                : '📝 Concept'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Project Delivery Dialog */}
      {showDeliveryDialog && project && (
        <ProjectDeliveryDialog
          project={project}
          isOpen={showDeliveryDialog}
          onClose={() => setShowDeliveryDialog(false)}
          onComplete={() => {
            setShowDeliveryDialog(false);
            // Navigate to projects list after successful delivery
            navigate('/projects');
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
