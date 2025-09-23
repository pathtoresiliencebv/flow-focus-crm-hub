import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, CreditCard, ExternalLink } from "lucide-react";
import { Invoice } from '@/hooks/useInvoices';

interface InvoicePaymentStatusProps {
  invoice: Invoice;
  onGeneratePaymentLink?: () => void;
  isGeneratingLink?: boolean;
}

export function InvoicePaymentStatus({ 
  invoice, 
  onGeneratePaymentLink, 
  isGeneratingLink = false 
}: InvoicePaymentStatusProps) {
  
  const getPaymentStatusBadge = () => {
    if (!invoice.payment_status || invoice.payment_status === 'pending') {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Nog niet betaald
        </Badge>
      );
    }
    
    if (invoice.payment_status === 'paid') {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Betaald
        </Badge>
      );
    }
    
    if (invoice.payment_status === 'failed') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Betaling mislukt
        </Badge>
      );
    }
    
    if (invoice.payment_status === 'processing') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-blue-600 border-blue-600">
          <Clock className="h-3 w-3" />
          Wordt verwerkt
        </Badge>
      );
    }
    
    return null;
  };

  const getPaymentDetails = () => {
    if (invoice.payment_date) {
      return (
        <div className="text-sm text-muted-foreground mt-1">
          Betaald op {new Date(invoice.payment_date).toLocaleDateString('nl-NL')}
          {invoice.payment_method && (
            <span className="ml-2 capitalize">via {invoice.payment_method}</span>
          )}
        </div>
      );
    }
    
    if (invoice.payment_failure_reason) {
      return (
        <div className="text-sm text-red-600 mt-1">
          Reden: {invoice.payment_failure_reason}
        </div>
      );
    }
    
    return null;
  };

  const showPaymentActions = () => {
    const isUnpaid = !invoice.payment_status || invoice.payment_status === 'pending' || invoice.payment_status === 'failed';
    
    return isUnpaid && (
      <div className="flex items-center gap-2 mt-2">
        {invoice.payment_link_url ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(invoice.payment_link_url, '_blank')}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Betaallink openen
          </Button>
        ) : (
          onGeneratePaymentLink && (
            <Button
              size="sm"
              variant="outline"
              onClick={onGeneratePaymentLink}
              disabled={isGeneratingLink}
              className="flex items-center gap-1"
            >
              <CreditCard className="h-3 w-3" />
              {isGeneratingLink ? 'Genereren...' : 'Betaallink maken'}
            </Button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Betalingsstatus:</span>
        {getPaymentStatusBadge()}
      </div>
      
      {getPaymentDetails()}
      {showPaymentActions()}
    </div>
  );
}