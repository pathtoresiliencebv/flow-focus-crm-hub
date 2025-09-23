import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Receipt, CreditCard } from "lucide-react";
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';

export function InvoicePaymentSuccess() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchInvoiceById, refetch } = useInvoices();
  const { toast } = useToast();
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (paymentStatus === 'success') {
      toast({
        title: "Betaling gelukt!",
        description: "Uw factuur is succesvol betaald. U ontvangt een bevestigingsmail.",
      });
      // Refresh invoice data to get updated payment status
      refetch();
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Betaling geannuleerd",
        description: "De betaling is geannuleerd. U kunt het later opnieuw proberen.",
        variant: "destructive",
      });
    }
  }, [paymentStatus, toast, refetch]);

  const handleBackToInvoices = () => {
    navigate('/invoices');
  };

  const handleViewInvoice = () => {
    navigate(`/invoices/${invoiceId}`);
  };

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Betaling Gelukt!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Uw factuur is succesvol betaald. U ontvangt binnenkort een bevestigingsmail.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={handleViewInvoice} className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Bekijk Factuur
              </Button>
              <Button variant="outline" onClick={handleBackToInvoices} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Terug naar Facturen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'cancelled') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CreditCard className="h-16 w-16 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-amber-600">
              Betaling Geannuleerd
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              De betaling is geannuleerd. U kunt het later opnieuw proberen.
            </p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={handleViewInvoice} className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Bekijk Factuur
              </Button>
              <Button variant="outline" onClick={handleBackToInvoices} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Terug naar Facturen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default case - redirect back to invoices
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground mb-4">Bezig met laden...</p>
          <Button onClick={handleBackToInvoices} variant="outline">
            Terug naar Facturen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}