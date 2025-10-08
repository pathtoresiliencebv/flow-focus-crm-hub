import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Users, Calendar, Euro, Mail, Phone, User, MapPin, Clock, CheckCircle2, Circle, Edit } from "lucide-react";
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
  const [loadingData, setLoadingData] = useState(false);

  // Find the project
  const project = projects.find(p => p.id === projectId);
  const customer = customers.find(c => c.id === project?.customer_id);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !project) return;
      
      setLoadingData(true);
      try {
        // Fetch tasks
        const { data: taskData } = await supabase
          .from('project_tasks')
          .select(`
            *,
            assignee:profiles!project_tasks_assigned_to_fkey(full_name, email)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        setTasks(taskData || []);

        // Fetch invoices
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('*')
          .or(`customer_id.eq.${project.customer_id},project_id.eq.${projectId}`)
          .order('created_at', { ascending: false });
        
        setInvoices(invoiceData || []);

        // Fetch quotes
        const { data: quoteData } = await supabase
          .from('quotes')
          .select('*')
          .or(`customer_id.eq.${project.customer_id},project_id.eq.${projectId}`)
          .order('created_at', { ascending: false });
        
        setQuotes(quoteData || []);

        // Fetch recent activities (task updates, etc)
        const { data: activityData } = await supabase
          .from('project_tasks')
          .select(`
            id,
            title,
            status,
            updated_at,
            assignee:profiles!project_tasks_assigned_to_fkey(full_name)
          `)
          .eq('project_id', projectId)
          .order('updated_at', { ascending: false })
          .limit(5);
        
        setActivities(activityData || []);
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [projectId, project?.customer_id]);

  // Handle task completion toggle
  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'voltooid' ? 'in_progress' : 'voltooid';
      
      const { error } = await supabase
        .from('project_tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // Refresh tasks
      const { data: taskData } = await supabase
        .from('project_tasks')
        .select(`
          *,
          assignee:profiles!project_tasks_assigned_to_fkey(full_name, email)
        `)
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
                      {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.total || 0), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resterend</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency((project.value || 0) - invoices.reduce((sum, inv) => sum + (inv.total || 0), 0))}
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

            {/* Activiteit */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Activiteit</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <p className="text-sm text-muted-foreground">Laden...</p>
                ) : activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nog geen activiteit</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="mt-1">
                          {activity.status === 'voltooid' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Edit className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.assignee?.full_name || 'Iemand'}</span>
                            {' '}
                            {activity.status === 'voltooid' ? 'heeft de taak' : 'heeft de status van'}
                            {' '}
                            <span className="font-medium">'{activity.title}'</span>
                            {' '}
                            {activity.status === 'voltooid' ? 'voltooid' : 'gewijzigd'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(activity.updated_at), "d MMMM 'om' HH:mm", { locale: nl })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                <TabsTrigger value="facturen">Facturen</TabsTrigger>
                <TabsTrigger value="offertes">Offertes</TabsTrigger>
              </TabsList>

              {/* PROJECT TAKEN TAB */}
              <TabsContent value="taken" className="p-4">
                {loadingData ? (
                  <p className="text-center text-muted-foreground py-8">Laden...</p>
                ) : tasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Geen taken gevonden</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          {profile?.role === 'Installateur' && <th className="pb-2 px-2 w-10"></th>}
                          <th className="pb-2 px-2 font-medium text-sm text-muted-foreground">TAAK</th>
                          <th className="pb-2 px-2 font-medium text-sm text-muted-foreground">STATUS</th>
                          <th className="pb-2 px-2 font-medium text-sm text-muted-foreground">TOEGEWEZEN AAN</th>
                          <th className="pb-2 px-2 font-medium text-sm text-muted-foreground">EINDDATUM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr key={task.id} className="border-b hover:bg-muted/50">
                            {/* Checkbox for Monteurs */}
                            {profile?.role === 'Installateur' && (
                              <td className="py-3 px-2">
                                <Checkbox
                                  checked={task.status === 'voltooid'}
                                  onCheckedChange={() => handleTaskToggle(task.id, task.status)}
                                  disabled={task.assigned_to !== user?.id}
                                />
                              </td>
                            )}
                            <td className="py-3 px-2 font-medium">{task.title}</td>
                            <td className="py-3 px-2">
                              <Badge 
                                variant={
                                  task.status === 'voltooid' ? 'outline' : 
                                  task.status === 'in_progress' ? 'default' : 
                                  'secondary'
                                }
                              >
                                {task.status === 'voltooid' ? 'Voltooid' : 
                                 task.status === 'in_progress' ? 'In uitvoering' : 
                                 'Niet gestart'}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">{task.assignee?.full_name || '-'}</td>
                            <td className="py-3 px-2">
                              {task.due_date ? format(new Date(task.due_date), 'dd-MM-yyyy') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* FACTUREN TAB */}
              <TabsContent value="facturen" className="p-4">
                {loadingData ? (
                  <p className="text-center text-muted-foreground py-8">Laden...</p>
                ) : invoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Geen facturen gevonden</p>
                ) : (
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="font-medium">Factuur #{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: nl })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(invoice.total)}</p>
                          <Badge variant={invoice.status === 'paid' ? 'outline' : 'secondary'}>
                            {invoice.status === 'paid' ? 'Betaald' : invoice.status === 'sent' ? 'Verzonden' : 'Concept'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* OFFERTES TAB */}
              <TabsContent value="offertes" className="p-4">
                {loadingData ? (
                  <p className="text-center text-muted-foreground py-8">Laden...</p>
                ) : quotes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Geen offertes gevonden</p>
                ) : (
                  <div className="space-y-2">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="font-medium">Offerte #{quote.quote_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(quote.created_at), 'dd MMM yyyy', { locale: nl })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(quote.total)}</p>
                          <Badge variant={quote.status === 'goedgekeurd' ? 'outline' : 'secondary'}>
                            {quote.status === 'goedgekeurd' ? 'Goedgekeurd' : quote.status === 'verzonden' ? 'Verzonden' : 'Concept'}
                          </Badge>
                        </div>
                      </div>
                    ))}
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
