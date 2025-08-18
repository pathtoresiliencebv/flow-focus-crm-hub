import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Send } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  project_title?: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: string;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  onViewInvoice: (invoiceId: string) => void;
  onSendInvoice: (invoiceId: string) => void;
  getStatusBadge: (status: string) => string;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  onViewInvoice,
  onSendInvoice,
  getStatusBadge,
}) => {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Geen facturen gevonden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{invoice.invoice_number}</h3>
                  <Badge className={getStatusBadge(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {invoice.customer_name}
                  {invoice.project_title && ` • ${invoice.project_title}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Vervaldatum: {new Date(invoice.due_date).toLocaleDateString('nl-NL')}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="font-medium">€{invoice.total_amount.toFixed(2)}</p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewInvoice(invoice.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {invoice.status !== 'betaald' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendInvoice(invoice.id)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};