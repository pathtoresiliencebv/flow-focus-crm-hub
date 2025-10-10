import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Users, Calendar, Euro, Mail, Phone, User, MapPin, Clock, CheckCircle2, Circle, Edit, FileText } from "lucide-react";
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
import { ProjectCompletionSlider } from "./ProjectCompletionSlider";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, customers } = useCrmStore();
  const { profile, user } = useAuth();
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPersonnel, setShowPersonnel] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
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
        const [taskResult, invoiceResult, quoteResult, activityResult, workOrderResult] = await Promise.all([
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
            .order('created_at', { ascending: false })
        ]);
        
        console.log('📊 ProjectDetail: Data fetched:', {
          tasks: taskResult.data?.length || 0,
          invoices: invoiceResult.data?.length || 0,
          quotes: quoteResult.data?.length || 0,
          workOrders: workOrderResult.data?.length || 0,
          invoices_data: invoiceResult.data,
          quotes_data: quoteResult.data
        });
        
        setTasks(taskResult.data || []);
        setInvoices(invoiceResult.data || []);
        setQuotes(quoteResult.data || []);
        setActivities(activityResult.data || []);
        setWorkOrders(workOrderResult.data || []);
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

            {/* Financieel overzicht */}
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
              </CardContent>
            </Card>

            {/* Activiteit - New Component with Database Integration */}
            <ProjectActivities projectId={projectId!} />

            {/* Project Completion Slider */}
            <ProjectCompletionSlider 
              projectId={projectId!}
              projectName={project?.name || ''}
              customerName={customer?.name || ''}
              isCompleted={project?.status === 'afgerond'}
              onCompletionChange={() => {
                // Refresh project data
                window.location.reload();
              }}
            />
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
                <TabsTrigger value="werkbonnen" className="relative">
                  Werkbonnen
                  {workOrders.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                      {workOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="facturen">Facturen</TabsTrigger>
                <TabsTrigger value="offertes">Offertes</TabsTrigger>
              </TabsList>

              {/* PROJECT TAKEN TAB */}
              <TabsContent value="taken" className="p-4">
                <ProjectTasks projectId={projectId || ''} />
              </TabsContent>

              {/* WERKBONNEN TAB */}
              <TabsContent value="werkbonnen" className="p-4">
                {loadingData ? (
                  <p className="text-center text-muted-foreground py-8">Laden...</p>
                ) : workOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Geen werkbonnen gevonden voor dit project</p>
                    <p className="text-xs mt-2">Werkbonnen worden aangemaakt na project oplevering</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workOrders.map((workOrder) => (
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
                          onClick={() => navigate(`/quotes/${quote.id}`)}
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
    </div>
  );
};

export default ProjectDetail;
