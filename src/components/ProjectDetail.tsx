
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, FileText, Users, Clipboard, BarChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CrmSidebar } from "@/components/CrmSidebar";
import { NotificationsMenu } from "@/components/NotificationsMenu";

// Import mock data
import { mockProjects, mockCustomers, mockInvoices } from "@/data/mockData";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("projects");
  const [projectDetailTab, setProjectDetailTab] = useState("details");
  const [searchTerm, setSearchTerm] = useState("");

  // Find the project from the mock data
  const project = mockProjects.find(p => p.id.toString() === projectId);
  
  // If project not found, show error message
  if (!project) {
    return (
      <div className="flex h-screen bg-gray-100">
        <CrmSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-smans-primary">SMANS CRM</h1>
            </div>
            <div className="flex items-center gap-4">
              <Input className="max-w-xs" placeholder="Zoeken..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <NotificationsMenu />
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug
            </Button>
            <div className="mt-6">
              <h2 className="text-2xl font-bold">Project niet gevonden</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find customer details
  const customer = mockCustomers.find(c => c.name === project.customer);
  
  // Find related invoices
  const projectInvoices = mockInvoices.filter(i => i.project === project.title);

  return (
    <div className="flex h-screen bg-gray-100">
      <CrmSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-smans-primary">SMANS CRM</h1>
          </div>
          <div className="flex items-center gap-4">
            <Input className="max-w-xs" placeholder="Zoeken..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <NotificationsMenu />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug
              </Button>
              <h2 className="text-2xl font-bold">Project: {project.title}</h2>
              <span className={`px-2 py-1 rounded-full text-xs ${
                project.status === "In uitvoering" ? "bg-blue-100 text-blue-800" :
                project.status === "Gepland" ? "bg-orange-100 text-orange-800" :
                project.status === "Afgerond" ? "bg-green-100 text-green-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {project.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Projectgegevens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Klant:</span> {project.customer}</p>
                    <p className="text-sm"><span className="font-medium">Datum:</span> {project.date}</p>
                    <p className="text-sm"><span className="font-medium">Status:</span> {project.status}</p>
                    <p className="text-sm"><span className="font-medium">Waarde:</span> €{project.value}</p>
                  </div>
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Financieel overzicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Project waarde:</span> €{project.value}</p>
                    <p className="text-sm"><span className="font-medium">Gefactureerd:</span> €{
                      projectInvoices
                        .reduce((sum, invoice) => sum + parseFloat(invoice.amount.replace(',', '.')), 0)
                        .toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }</p>
                    <p className="text-sm"><span className="font-medium">Aantal facturen:</span> {projectInvoices.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={projectDetailTab} onValueChange={setProjectDetailTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">
                  <Clipboard className="mr-2 h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="planning">
                  <Calendar className="mr-2 h-4 w-4" />
                  Planning
                </TabsTrigger>
                <TabsTrigger value="materials">
                  <FileText className="mr-2 h-4 w-4" />
                  Materialen
                </TabsTrigger>
                <TabsTrigger value="personnel">
                  <Users className="mr-2 h-4 w-4" />
                  Personeel
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <BarChart className="mr-2 h-4 w-4" />
                  Rapportages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Projectdetails</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Project specificaties</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                      <h3 className="font-semibold mb-2">Opmerkingen</h3>
                      <p className="text-sm text-muted-foreground">
                        Nog geen opmerkingen toegevoegd voor dit project.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="planning">
                <Card>
                  <CardHeader>
                    <CardTitle>Planning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                      Nog geen planning beschikbaar voor dit project.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materials">
                <Card>
                  <CardHeader>
                    <CardTitle>Materialen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                      Nog geen materiaallijst beschikbaar voor dit project.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="personnel">
                <Card>
                  <CardHeader>
                    <CardTitle>Toegewezen personeel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                      Nog geen personeel toegewezen aan dit project.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Rapportages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                      Nog geen rapportages beschikbaar voor dit project.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
