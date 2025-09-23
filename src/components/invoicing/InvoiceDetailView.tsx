import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface InvoiceDetailViewProps {
  invoice: any;
  invoiceItems: any[];
  onBack: () => void;
  onMarkAsPaid: (invoiceId: string) => void;
  onDownloadPdf: (invoiceId: string) => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  invoiceItems,
  onBack,
  onMarkAsPaid,
  onDownloadPdf
}) => {
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);

  const getStatusBadge = (status: string, dueDate?: string) => {
    const today = new Date();
    const due = dueDate ? new Date(dueDate) : null;
    const isOverdue = due && due < today && status !== 'betaald';

    if (status === 'betaald') {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Betaald
      </Badge>;
    }

    if (isOverdue) {
      return <Badge variant="destructive">
        <AlertCircle className="w-3 h-3 mr-1" />
        Vervallen
      </Badge>;
    }

    if (invoice.sent_date) {
      return <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Verstuurd
      </Badge>;
    }

    return <Badge variant="outline">Concept</Badge>;
  };

  const handleMarkAsPaid = async () => {
    setIsMarkingAsPaid(true);
    try {
      await onMarkAsPaid(invoice.id);
      toast.success("Factuur gemarkeerd als betaald");
    } catch (error) {
      toast.error("Fout bij markeren als betaald");
    } finally {
      setIsMarkingAsPaid(false);
    }
  };

  const getPaymentTermDescription = () => {
    if (!invoice.payment_terms || invoice.payment_terms.length === 0) {
      return "Volledige betaling (100%)";
    }

    const paymentTerm = invoice.payment_terms.find((term: any) => 
      term.sequence === invoice.payment_term_sequence
    );

    if (paymentTerm) {
      return `${paymentTerm.description} (${paymentTerm.percentage}%)`;
    }

    return `Termijn ${invoice.payment_term_sequence} van ${invoice.total_payment_terms}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Terug
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-muted-foreground">
              {invoice.customer_name} • {format(new Date(invoice.invoice_date), 'dd-MM-yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(invoice.status, invoice.due_date)}
          <Button variant="outline" onClick={() => onDownloadPdf(invoice.id)}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Details & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Factuurgegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Factuurnummer:</span>
                  <p className="font-mono">{invoice.invoice_number}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Totaalbedrag:</span>
                  <p className="text-lg font-bold">€{invoice.total_amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <div className="mt-1">{getStatusBadge(invoice.status, invoice.due_date)}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Betalingsterm:</span>
                  <p>{getPaymentTermDescription()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes/Message */}
          {invoice.message && (
            <Card>
              <CardHeader>
                <CardTitle>Notities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Invoice Items Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Factuurregels ({invoiceItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {invoiceItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.description}</p>
                      {item.quantity && item.unit_price && (
                        <p className="text-xs text-muted-foreground">
                          {item.quantity}x €{item.unit_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">€{item.total?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer & Payment Details */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Klantgegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium text-muted-foreground">Naam:</span>
                <p>{invoice.customer_name}</p>
              </div>
              {invoice.customer_email && (
                <div>
                  <span className="font-medium text-muted-foreground">E-mail:</span>
                  <p className="text-sm">{invoice.customer_email}</p>
                </div>
              )}
              {invoice.project_title && (
                <div>
                  <span className="font-medium text-muted-foreground">Project:</span>
                  <p className="text-sm">{invoice.project_title}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Factuur Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Factuurdatum:</span>
                <span>{format(new Date(invoice.invoice_date), 'dd-MM-yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vervaldatum:</span>
                <span className={new Date(invoice.due_date) < new Date() && invoice.status !== 'betaald' ? 'text-destructive font-medium' : ''}>
                  {format(new Date(invoice.due_date), 'dd-MM-yyyy')}
                </span>
              </div>
              {invoice.sent_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verstuurd op:</span>
                  <span>{format(new Date(invoice.sent_date), 'dd-MM-yyyy HH:mm')}</span>
                </div>
              )}
              {invoice.payment_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Betaald op:</span>
                  <span>{format(new Date(invoice.payment_date), 'dd-MM-yyyy HH:mm')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Processing */}
          {invoice.status !== 'betaald' && (
            <Card>
              <CardHeader>
                <CardTitle>Betaling Verwerken</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleMarkAsPaid} 
                  className="w-full"
                  disabled={isMarkingAsPaid}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isMarkingAsPaid ? 'Markeren...' : 'Markeer als Betaald'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Betalingsinstructies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p><strong>SMANS BV</strong></p>
              <p>Bedrijfsstraat 123</p>
              <p>1234 AB Amsterdam</p>
              <p>Nederland</p>
              <hr className="my-2" />
              <p>KvK: 12345678</p>
              <p>BTW: NL123456789B01</p>
              <p>IBAN: NL00 BANK 0123 4567 89</p>
              <p className="text-muted-foreground mt-2">
                Vermeld bij betaling: {invoice.invoice_number}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};