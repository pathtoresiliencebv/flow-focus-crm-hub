
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, File, CheckCircle, Clock, Receipt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectsBoard } from "@/components/ProjectsBoard";
import { useCrmStore } from "@/hooks/useCrmStore";
import { CrmSidebar } from "@/components/CrmSidebar";
import { NotificationsMenu } from "@/components/NotificationsMenu";

// Import mock data for invoices only
import { mockInvoices } from "@/data/mockData";

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("customers");
  const [customerDetailTab, setCustomerDetailTab] = useState("projects");
  const [searchTerm, setSearchTerm] = useState("");
  const { customers, projects } = useCrmStore();

  // Find the customer from the CRM store
  const customer = customers.find(c => c.id.toString() === customerId);
  
  // If customer not found, show error message
  if (!customer) {
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
              <h2 className="text-2xl font-bold">Klant niet gevonden</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter projects for this customer
  const customerProjects = projects.filter(p => p.customerId === customer.id);

  // Filter invoices for this customer
  const customerInvoices = mockInvoices.filter(i => i.customer === customer.name);

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
              <h2 className="text-2xl font-bold">Klantdossier: {customer.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Klantgegevens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Email:</span> {customer.email}</p>
                    <p className="text-sm"><span className="font-medium">Telefoon:</span> {customer.phone}</p>
                    <p className="text-sm"><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        customer.status === "Actief" ? "bg-green-100 text-green-800" :
                        customer.status === "In behandeling" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {customer.status}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Projecten overzicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Totaal aantal projecten:</span> {customerProjects.length}</p>
                    <p className="text-sm"><span className="font-medium">Actieve projecten:</span> {customerProjects.filter(p => p.status !== "afgerond").length}</p>
                    <p className="text-sm"><span className="font-medium">Afgeronde projecten:</span> {customerProjects.filter(p => p.status === "afgerond").length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Financieel overzicht</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm"><span className="font-medium">Totaal gefactureerd:</span> €{
                      customerInvoices
                        .reduce((sum, invoice) => sum + parseFloat(invoice.amount.replace(',', '.')), 0)
                        .toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }</p>
                    <p className="text-sm"><span className="font-medium">Openstaande facturen:</span> {customerInvoices.filter(i => i.status !== "Betaald").length}</p>
                    <p className="text-sm"><span className="font-medium">Betaalde facturen:</span> {customerInvoices.filter(i => i.status === "Betaald").length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={customerDetailTab} onValueChange={setCustomerDetailTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="projects">
                  <Clock className="mr-2 h-4 w-4" />
                  Projecten
                </TabsTrigger>
                <TabsTrigger value="invoices">
                  <Receipt className="mr-2 h-4 w-4" />
                  Facturen
                </TabsTrigger>
                <TabsTrigger value="quotes">
                  <File className="mr-2 h-4 w-4" />
                  Offertes
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Rapportages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects">
                <h3 className="text-xl font-semibold mb-4">Projecten van {customer.name}</h3>
                {customerProjects.length > 0 ? (
                  <ProjectsBoard />
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">Geen projecten gevonden voor deze klant.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="invoices">
                <h3 className="text-xl font-semibold mb-4">Facturen van {customer.name}</h3>
                {customerInvoices.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4">Factuurnr.</th>
                            <th className="text-left p-4">Project</th>
                            <th className="text-left p-4">Datum</th>
                            <th className="text-left p-4">Vervaldatum</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-right p-4">Bedrag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerInvoices.map(invoice => (
                            <tr key={invoice.id} className="border-b">
                              <td className="p-4 font-medium">{invoice.number}</td>
                              <td className="p-4">{invoice.project}</td>
                              <td className="p-4">{invoice.date}</td>
                              <td className="p-4">{invoice.dueDate}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  invoice.status === "Betaald" ? "bg-green-100 text-green-800" :
                                  invoice.status === "Verzonden" ? "bg-blue-100 text-blue-800" :
                                  invoice.status === "Concept" ? "bg-gray-100 text-gray-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">€{invoice.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">Geen facturen gevonden voor deze klant.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="quotes">
                <h3 className="text-xl font-semibold mb-4">Offertes van {customer.name}</h3>
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      Nog geen offertes beschikbaar voor deze klant.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <h3 className="text-xl font-semibold mb-4">Rapportages voor {customer.name}</h3>
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                      Nog geen rapportages beschikbaar voor deze klant.
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

export default CustomerDetail;
