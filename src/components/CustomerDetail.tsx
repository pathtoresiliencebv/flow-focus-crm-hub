import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, File, Clock, Receipt, FolderKanban, Edit, Eye, Download, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCrmStore } from "@/hooks/useCrmStore";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { customers, projects } = useCrmStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Find the customer from the CRM store
  const customer = customers.find(c => c.id === customerId);
  
  // Filter projects for this customer
  const customerProjects = projects.filter(p => p.customer_id === customerId);

  // Fetch invoices and quotes for this customer
  useEffect(() => {
    const fetchData = async () => {
      if (!customerId || !customer) return;
      
      try {
        setLoading(true);
        
        // Fetch invoices - try by customer_id first, fallback to customer_name
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .or(`customer_id.eq.${customerId},customer_name.eq.${customer.name}`)
          .order('created_at', { ascending: false });

        if (!invoiceError && invoiceData) {
          setInvoices(invoiceData);
        } else if (invoiceError) {
          console.error('Error fetching invoices:', invoiceError);
        }

        // Fetch quotes - try by customer_id first, fallback to customer_name
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .or(`customer_id.eq.${customerId},customer_name.eq.${customer.name}`)
          .order('created_at', { ascending: false });

        if (!quoteError && quoteData) {
          setQuotes(quoteData);
        } else if (quoteError) {
          console.error('Error fetching quotes:', quoteError);
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, customer]);

  // If customer not found, show error message
  if (!customer) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>
        <div className="mt-6">
          <h2 className="text-2xl font-bold">Klant niet gevonden</h2>
        </div>
      </div>
    );
  }

  const getProjectStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'te-plannen': { label: 'Te plannen', className: 'bg-gray-100 text-gray-800' },
      'gepland': { label: 'Gepland', className: 'bg-yellow-100 text-yellow-800' },
      'in-uitvoering': { label: 'In uitvoering', className: 'bg-blue-100 text-blue-800' },
      'afgerond': { label: 'Afgerond', className: 'bg-green-100 text-green-800' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'concept': { label: 'Concept', className: 'bg-gray-100 text-gray-800' },
      'verzonden': { label: 'Verzonden', className: 'bg-blue-100 text-blue-800' },
      'betaald': { label: 'Betaald', className: 'bg-green-100 text-green-800' },
      'achterstallig': { label: 'Achterstallig', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getQuoteStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'concept': { label: 'Concept', className: 'bg-gray-100 text-gray-800' },
      'verzonden': { label: 'Verzonden', className: 'bg-blue-100 text-blue-800' },
      'geaccepteerd': { label: 'Geaccepteerd', className: 'bg-green-100 text-green-800' },
      'afgewezen': { label: 'Afgewezen', className: 'bg-red-100 text-red-800' },
      'verlopen': { label: 'Verlopen', className: 'bg-orange-100 text-orange-800' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const totalInvoiced = invoices
    .filter(inv => inv.status === 'betaald')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const totalQuoted = quotes.reduce((sum, q) => sum + (q.total || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>
        <h2 className="text-2xl font-bold">Klantdossier: {customer.name}</h2>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Klantgegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm"><span className="font-medium">Email:</span> {customer.email || '-'}</p>
              <p className="text-sm"><span className="font-medium">Telefoon:</span> {customer.phone || '-'}</p>
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
              <p className="text-sm"><span className="font-medium">Totaal gefactureerd:</span> €{totalInvoiced.toFixed(2)}</p>
              <p className="text-sm"><span className="font-medium">Totaal geoffreerd:</span> €{totalQuoted.toFixed(2)}</p>
              <p className="text-sm"><span className="font-medium">Openstaande facturen:</span> {invoices.filter(i => i.status !== "betaald").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projecten Sectie */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Projecten ({customerProjects.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {customerProjects.length > 0 ? (
            <div className="divide-y">
              {customerProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-4 hover:bg-accent/50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{project.title}</h4>
                      {getProjectStatusBadge(project.status)}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {project.date && (
                        <span>📅 {format(new Date(project.date), 'dd MMM yyyy', { locale: nl })}</span>
                      )}
                      {project.value && (
                        <span>💰 €{project.value}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Geen projecten gevonden voor deze klant.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facturen Sectie */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Facturen ({invoices.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Laden...</div>
          ) : invoices.length > 0 ? (
            <div className="divide-y">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="p-4 hover:bg-accent/50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">Factuur #{invoice.invoice_number || invoice.id.slice(0, 8)}</h4>
                      {getInvoiceStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {invoice.invoice_date && (
                        <span>📅 {format(new Date(invoice.invoice_date), 'dd MMM yyyy', { locale: nl })}</span>
                      )}
                      {invoice.due_date && (
                        <span>⏰ Vervalt: {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: nl })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">€{invoice.total?.toFixed(2) || '0.00'}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Geen facturen gevonden voor deze klant.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offertes Sectie */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <File className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Offertes ({quotes.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Laden...</div>
          ) : quotes.length > 0 ? (
            <div className="divide-y">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => navigate(`/quotes/${quote.id}/preview`)}
                  className="p-4 hover:bg-accent/50 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">Offerte #{quote.quote_number || quote.id.slice(0, 8)}</h4>
                      {getQuoteStatusBadge(quote.status)}
                    </div>
                    {quote.title && (
                      <p className="text-sm text-muted-foreground">{quote.title}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {quote.quote_date && (
                        <span>📅 {format(new Date(quote.quote_date), 'dd MMM yyyy', { locale: nl })}</span>
                      )}
                      {quote.valid_until && (
                        <span>⏰ Geldig tot: {format(new Date(quote.valid_until), 'dd MMM yyyy', { locale: nl })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">€{quote.total?.toFixed(2) || '0.00'}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Geen offertes gevonden voor deze klant.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetail;
