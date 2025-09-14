import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInvoices } from "@/hooks/useInvoices";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

export const ArchivedInvoicesView = () => {
  const { toast } = useToast();
  const { archivedInvoices, loading, restoreInvoice } = useInvoices();

  const handleRestore = async (invoiceId: string) => {
    try {
      await restoreInvoice(invoiceId);
      toast({
        title: "Factuur hersteld",
        description: "De factuur is succesvol hersteld naar actieve facturen."
      });
    } catch (error) {
      toast({
        title: "Fout bij herstellen",
        description: "Er is een fout opgetreden bij het herstellen van de factuur.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Gearchiveerde facturen laden...</div>;
  }

  if (!archivedInvoices?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gearchiveerde Facturen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Geen gearchiveerde facturen gevonden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gearchiveerde Facturen ({archivedInvoices.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {archivedInvoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{invoice.invoice_number}</h4>
                  <Badge variant="secondary">{invoice.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {invoice.customer_name} • €{invoice.total_amount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Gearchiveerd {formatDistanceToNow(new Date(invoice.archived_at!), { 
                    addSuffix: true, 
                    locale: nl 
                  })}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/invoices/${invoice.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(invoice.id)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};