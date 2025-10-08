
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, FileText, Users, Clipboard, Edit, Save, X, User, Pencil, Package, UserCog, Clock, Receipt, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCrmStore, UpdateProject } from "@/hooks/useCrmStore";
import { useUsers } from "@/hooks/useUsers";
import { ProjectMaterials } from "./ProjectMaterials";
import { ProjectPersonnel } from "./ProjectPersonnel";
import { ProjectPlanning } from "./ProjectPlanning";
import { ProjectTasks } from "./ProjectTasks";
import { useProjectDelivery } from "@/hooks/useProjectDelivery";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, customers, updateProject } = useCrmStore();
  const { monteurs, isLoading: isLoadingUsers } = useUsers();
  const { profile, user } = useAuth();
  const { startProject, isStarting } = useProjectDelivery();
  const [isEditing, setIsEditing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPersonnel, setShowPersonnel] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [workTimeLogs, setWorkTimeLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    customerId: "",
    date: "",
    value: "",
    status: "",
    description: "",
    assignedUserId: "",
  });

  // Find the project from the CRM store
  const project = projects.find(p => p.id === projectId);
  
  // If project not found, show error message
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

  // Find customer details
  const customer = customers.find(c => c.id === project.customer_id);
  const assignedMonteur = monteurs.find(m => m.id === project.assigned_user_id);

  // Fetch invoices, quotes, and work time logs
  useEffect(() => {
    if (project?.customer_id) {
      fetchInvoicesAndQuotes();
    }
    if (projectId) {
      fetchWorkTimeLogs();
    }
  }, [project?.customer_id, projectId]);

  const fetchInvoicesAndQuotes = async () => {
    setLoadingData(true);
    try {
      // Fetch invoices for customer
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', project.customer_id)
        .order('created_at', { ascending: false });
      
      setInvoices(invoiceData || []);
      
      // Fetch quotes for customer
      const { data: quoteData } = await supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', project.customer_id)
        .order('created_at', { ascending: false });
      
      setQuotes(quoteData || []);
    } catch (error) {
      console.error('Error fetching invoices and quotes:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchWorkTimeLogs = async () => {
    try {
      const { data } = await supabase
        .from('work_time_logs')
        .select(`
          *,
          installer:profiles!work_time_logs_installer_id_fkey(full_name, email)
        `)
        .eq('project_id', projectId)
        .order('started_at', { ascending: false });
      
      setWorkTimeLogs(data || []);
    } catch (error) {
      console.error('Error fetching work time logs:', error);
    }
  };

  const handleEditStart = () => {
    setEditData({
      title: project.title,
      customerId: project.customer_id,
      date: project.date ?? '',
      value: project.value?.toString() ?? '',
      status: project.status ?? 'te-plannen',
      description: project.description ?? '',
      assignedUserId: project.assigned_user_id ?? 'none',
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditData({
      title: "",
      customerId: "",
      date: "",
      value: "",
      status: "",
      description: "",
      assignedUserId: "",
    });
  };

  const handleEditSave = () => {
    const projectData: UpdateProject = {
      title: editData.title,
      customer_id: editData.customerId,
      date: editData.date || null,
      value: Number(editData.value) || null,
      status: editData.status as "te-plannen" | "gepland" | "herkeuring" | "afgerond",
      description: editData.description || null,
      assigned_user_id: editData.assignedUserId === "none" ? null : (editData.assignedUserId || null),
    };
    updateProject(project.id, projectData);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStartProject = async () => {
    await startProject(project.id);
  };

  const handleCompleteProject = () => {
    navigate(`/projects/${projectId}/delivery`);
  };

  const canManageProject = profile?.role === 'Installateur' && project.assigned_user_id === user?.id;
  const canEditTabs = profile?.role === 'Administrator' || profile?.role === 'Administratie';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="w-fit">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold">{project.title}</h2>
              <span className={`px-2 py-1 rounded-full text-xs w-fit ${
                project.status === "gepland" ? "bg-orange-100 text-orange-800" :
                project.status === "afgerond" ? "bg-green-100 text-green-800" :
                project.status === "herkeuring" ? "bg-gray-100 text-gray-800" :
                project.status === 'in-uitvoering' ? 'bg-blue-100 text-blue-800' :
                "bg-red-100 text-red-800"
              }`}>
                {project.status === "te-plannen" ? "Te plannen" :
                 project.status === "gepland" ? "Gepland" :
                 project.status === "in-uitvoering" ? "In uitvoering" :
                 project.status === "herkeuring" ? "Herkeuring" :
                 project.status === "afgerond" ? "Afgerond" :
                 "Onbekend"}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {!isEditing ? (
              <Button onClick={handleEditStart} size="sm" className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" />
                Bewerken
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleEditCancel} size="sm" className="flex-1 sm:flex-none">
                  <X className="mr-2 h-4 w-4" />
                  Annuleren
                </Button>
                <Button onClick={handleEditSave} size="sm" className="flex-1 sm:flex-none">
                  <Save className="mr-2 h-4 w-4" />
                  Opslaan
                </Button>
              </>
            )}

            {/* Project Action Buttons for Installateurs */}
            {canManageProject && (
              <div className="flex gap-2">
                {project.status === 'gepland' && (
                  <Button 
                    onClick={handleStartProject}
                    disabled={isStarting}
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    {isStarting ? 'Project starten...' : 'Project Starten'}
                  </Button>
                )}
                
                {project.status === 'in-uitvoering' && (
                  <Button 
                    onClick={handleCompleteProject}
                    disabled={isCompleting}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    Project Opleveren
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={`grid grid-cols-1 ${profile?.role === 'Installateur' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projectgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="edit-title" className="text-xs font-medium">Projectnaam</Label>
                  <Input
                    id="edit-title"
                    value={editData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-customer" className="text-xs font-medium">Klant</Label>
                  <Select value={editData.customerId} onValueChange={(value) => handleInputChange("customerId", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer klant" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-date" className="text-xs font-medium">Datum</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status" className="text-xs font-medium">Status</Label>
                  <Select value={editData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="te-plannen">Te plannen</SelectItem>
                      <SelectItem value="gepland">Gepland</SelectItem>
                      <SelectItem value="in-uitvoering">In uitvoering</SelectItem>
                      <SelectItem value="herkeuring">Herkeuring</SelectItem>
                      <SelectItem value="afgerond">Afgerond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {profile?.role !== 'Installateur' && (
                  <div>
                    <Label htmlFor="edit-value" className="text-xs font-medium">Waarde (€)</Label>
                    <Input
                      id="edit-value"
                      type="number"
                      value={editData.value}
                      onChange={(e) => handleInputChange("value", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="edit-assigned-user" className="text-xs font-medium">Toegewezen monteur</Label>
                  <Select value={editData.assignedUserId} onValueChange={(value) => handleInputChange("assignedUserId", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer monteur" />
                    </SelectTrigger>
                     <SelectContent className="bg-background border shadow-md z-50">
                       <SelectItem value="none">Geen monteur toegewezen</SelectItem>
                       {isLoadingUsers ? (
                         <SelectItem value="loading" disabled>Monteurs laden...</SelectItem>
                       ) : monteurs.length === 0 ? (
                         <SelectItem value="unavailable" disabled>Geen monteurs beschikbaar</SelectItem>
                       ) : (
                        monteurs.map((monteur) => (
                          <SelectItem key={monteur.id} value={monteur.id}>
                            {monteur.full_name || monteur.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Klant:</span> {project.customer}</p>
                <p className="text-sm"><span className="font-medium">Datum:</span> {project.date}</p>
                <p className="text-sm"><span className="font-medium">Status:</span> {
                  project.status === "te-plannen" ? "Te plannen" :
                  project.status === "gepland" ? "Gepland" :
                  project.status === 'in-uitvoering' ? "In uitvoering" :
                  project.status === "herkeuring" ? "Herkeuring" :
                  project.status === "afgerond" ? "Afgerond" :
                  "Onbekend"
                }</p>
                {profile?.role !== 'Installateur' && (
                  <p className="text-sm"><span className="font-medium">Waarde:</span> €{project.value}</p>
                )}
                <p className="text-sm"><span className="font-medium">Monteur:</span> {
                  assignedMonteur ? (assignedMonteur.full_name || assignedMonteur.email) : "Niet toegewezen"
                }</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Klantgegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {customer ? (
                <>
                  <p className="text-sm"><span className="font-medium">Naam:</span> {customer.name}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {customer.email}</p>
                  <p className="text-sm"><span className="font-medium">Telefoon:</span> {customer.phone}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    Bekijk klant
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Geen klantgegevens beschikbaar</p>
              )}
            </div>
          </CardContent>
        </Card>

        {profile?.role !== 'Installateur' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Financieel overzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Project waarde:</span> €{project.value}</p>
                <p className="text-sm"><span className="font-medium">Gefactureerd:</span> €0.00</p>
                <p className="text-sm"><span className="font-medium">Aantal facturen:</span> 0</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Sheet open={showPlanning} onOpenChange={setShowPlanning}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex flex-col gap-2 py-6 h-auto w-full">
              <Calendar className="h-6 w-6" />
              <span className="font-medium">Planning</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Planning - {project.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ProjectPlanning projectId={project.id} projectTitle={project.title} />
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={showMaterials} onOpenChange={setShowMaterials}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex flex-col gap-2 py-6 h-auto w-full">
              <Package className="h-6 w-6" />
              <span className="font-medium">Materialen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Materialen - {project.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ProjectMaterials projectId={project.id} />
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={showPersonnel} onOpenChange={setShowPersonnel}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex flex-col gap-2 py-6 h-auto w-full">
              <UserCog className="h-6 w-6" />
              <span className="font-medium">Personeel</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Personeel - {project.title}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ProjectPersonnel projectId={project.id} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Project Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="h-4 w-4 mr-2" />
            Activiteit ({workTimeLogs.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="h-4 w-4 mr-2" />
            Facturen ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Offertes ({quotes.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projectdetails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Beschrijving</h3>
                {isEditing ? (
                  <Textarea
                    value={editData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Beschrijf het project..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {project.description || "Nog geen beschrijving toegevoegd voor dit project."}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Project specificaties</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Type project</p>
                    <p className="text-sm text-muted-foreground">{project.title.includes("kozijn") ? "Kozijnwerk" : "Glaswerk"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Locatie</p>
                    <p className="text-sm text-muted-foreground">Nog niet gespecificeerd</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Omvang werk</p>
                    <p className="text-sm text-muted-foreground">Standaard installatie</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Verwachte doorlooptijd</p>
                    <p className="text-sm text-muted-foreground">3-5 werkdagen</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProjectTasks projectId={project.id} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monteur Activiteit</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <p className="text-center text-muted-foreground py-8">Laden...</p>
              ) : workTimeLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nog geen activiteit geregistreerd</p>
              ) : (
                <div className="space-y-4">
                  {workTimeLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-blue-500 pl-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{log.installer?.full_name || log.installer?.email || 'Monteur'}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.started_at && format(new Date(log.started_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                          </p>
                        </div>
                        <Badge className={
                          log.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          log.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }>
                          {log.status === 'completed' ? 'Afgerond' : 
                           log.status === 'active' ? 'Actief' : 
                           log.status}
                        </Badge>
                      </div>
                      {log.total_minutes && (
                        <p className="text-sm text-muted-foreground">
                          ⏱️ {Math.floor(log.total_minutes / 60)}u {log.total_minutes % 60}m
                        </p>
                      )}
                      {log.ended_at && (
                        <p className="text-sm text-muted-foreground">
                          Beëindigd: {format(new Date(log.ended_at), 'HH:mm', { locale: nl })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facturen van {customer?.name || 'deze klant'}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <p className="text-center text-muted-foreground py-8">Laden...</p>
              ) : invoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nog geen facturen voor deze klant</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">Factuur #{invoice.invoice_number || invoice.id.slice(0, 8)}</h4>
                            <Badge className={
                              invoice.status === 'betaald' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'verzonden' ? 'bg-blue-100 text-blue-800' :
                              invoice.status === 'concept' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {invoice.status}
                            </Badge>
                          </div>
                          {invoice.project_title && (
                            <p className="text-sm text-muted-foreground mt-1">{invoice.project_title}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {invoice.invoice_date && (
                              <span>📅 {format(new Date(invoice.invoice_date), 'dd MMM yyyy', { locale: nl })}</span>
                            )}
                            {invoice.due_date && (
                              <span>⏰ Vervalt: {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: nl })}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{invoice.total_amount?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offertes van {customer?.name || 'deze klant'}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <p className="text-center text-muted-foreground py-8">Laden...</p>
              ) : quotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nog geen offertes voor deze klant</p>
              ) : (
                <div className="space-y-3">
                  {quotes.map((quote) => (
                    <div 
                      key={quote.id} 
                      className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/quotes/${quote.id}/preview`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">Offerte #{quote.quote_number || quote.id.slice(0, 8)}</h4>
                            <Badge className={
                              quote.status === 'goedgekeurd' ? 'bg-green-100 text-green-800' :
                              quote.status === 'verzonden' ? 'bg-blue-100 text-blue-800' :
                              quote.status === 'concept' ? 'bg-gray-100 text-gray-800' :
                              quote.status === 'afgewezen' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {quote.status}
                            </Badge>
                          </div>
                          {quote.project_title && (
                            <p className="text-sm text-muted-foreground mt-1">{quote.project_title}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {quote.quote_date && (
                              <span>📅 {format(new Date(quote.quote_date), 'dd MMM yyyy', { locale: nl })}</span>
                            )}
                            {quote.valid_until && (
                              <span>⏰ Geldig tot: {format(new Date(quote.valid_until), 'dd MMM yyyy', { locale: nl })}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">€{(quote.total_amount + quote.total_vat_amount)?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Project Delivery Dialog */}
    </div>
  );
};

export default ProjectDetail;
