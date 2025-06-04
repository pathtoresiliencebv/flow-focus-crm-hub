import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Check, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface QuoteData {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  project_title: string;
  quote_date: string;
  valid_until: string;
  message: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    vatRate: number;
    total: number;
  }>;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  admin_signature_data: string;
  client_signature_data: string;
  client_signed_at: string;
  client_name: string;
}

export default function PublicQuote() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientSignature, setClientSignature] = useState('');

  useEffect(() => {
    if (token) {
      fetchQuote();
    }
  }, [token]);

  const fetchQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('public_token', token)
        .single();

      if (error) {
        console.error('Error fetching quote:', error);
        toast({
          title: "Offerte niet gevonden",
          description: "De opgevraagde offerte kon niet worden gevonden.",
          variant: "destructive",
        });
        return;
      }

      // Type cast the items from Json to the expected array type
      const typedQuote: QuoteData = {
        ...data,
        items: Array.isArray(data.items) ? data.items as Array<{
          description: string;
          quantity: number;
          price: number;
          vatRate: number;
          total: number;
        }> : []
      };

      setQuote(typedQuote);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het laden van de offerte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignQuote = async () => {
    if (!clientName.trim() || !clientSignature) {
      toast({
        title: "Incomplete gegevens",
        description: "Vul uw naam in en plaats uw handtekening.",
        variant: "destructive",
      });
      return;
    }

    setSigning(true);
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          client_signature_data: clientSignature,
          client_signed_at: new Date().toISOString(),
          client_name: clientName.trim(),
          status: 'approved'
        })
        .eq('public_token', token);

      if (error) {
        console.error('Error signing quote:', error);
        toast({
          title: "Fout bij ondertekenen",
          description: "Er is een fout opgetreden bij het ondertekenen van de offerte.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Offerte ondertekend!",
        description: "De offerte is succesvol ondertekend. We nemen binnenkort contact met u op.",
      });

      // Refresh quote data
      await fetchQuote();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Goedgekeurd</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800">Verzonden</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Verlopen</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Afgewezen</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Concept</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-smans-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Offerte laden...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Offerte niet gevonden</h1>
          <p className="text-gray-600">De opgevraagde offerte bestaat niet of is niet langer beschikbaar.</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quote.valid_until) < new Date();
  const isSigned = quote.client_signed_at && quote.client_signature_data;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
                alt="SMANS Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">OFFERTE</h1>
              <p className="text-xl font-medium text-smans-primary">{quote.quote_number}</p>
              {getStatusBadge(quote.status)}
            </div>
          </div>

          {/* Quote Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Van:</h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium">SMANS BV</p>
                <p>Bedrijfsstraat 123</p>
                <p>1234 AB Amsterdam</p>
                <p>Nederland</p>
                <p className="mt-2">BTW: NL123456789B01</p>
                <p>KvK: 12345678</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Aan:</h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{quote.customer_name}</p>
                {quote.customer_email && <p>{quote.customer_email}</p>}
                {quote.project_title && (
                  <p className="mt-2 text-smans-primary">Project: {quote.project_title}</p>
                )}
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-gray-700">Offertedatum</h4>
                <p className="text-sm text-gray-600">{format(new Date(quote.quote_date), 'dd MMMM yyyy', { locale: nl })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-gray-700">Geldig tot</h4>
                <p className={`text-sm ${isExpired ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                  {format(new Date(quote.valid_until), 'dd MMMM yyyy', { locale: nl })}
                  {isExpired && ' (Verlopen)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <h4 className="font-medium text-gray-700">Status</h4>
                <p className="text-sm text-gray-600">{getStatusBadge(quote.status)}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          {quote.message && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Bericht:</h4>
              <p className="text-sm text-gray-600">{quote.message}</p>
            </div>
          )}
        </div>

        {/* Quote Items */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h3 className="text-lg font-semibold mb-4">Offerteregels</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 font-semibold text-gray-900">Omschrijving</th>
                  <th className="text-center py-3 font-semibold text-gray-900 w-16">Aantal</th>
                  <th className="text-right py-3 font-semibold text-gray-900 w-20">Prijs</th>
                  <th className="text-center py-3 font-semibold text-gray-900 w-16">BTW%</th>
                  <th className="text-right py-3 font-semibold text-gray-900 w-24">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-800">{item.description}</td>
                    <td className="py-3 text-center text-gray-800">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-800">€{item.price.toFixed(2)}</td>
                    <td className="py-3 text-center text-gray-800">{item.vatRate}%</td>
                    <td className="py-3 text-right text-gray-800 font-medium">€{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotaal:</span>
                <span className="font-medium">€{quote.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">BTW:</span>
                <span className="font-medium">€{quote.vat_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-200">
                <span className="font-bold text-lg">Totaal:</span>
                <span className="font-bold text-lg text-smans-primary">€{quote.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Signature */}
        {quote.admin_signature_data && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h3 className="text-lg font-semibold mb-4">SMANS BV</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img 
                src={quote.admin_signature_data} 
                alt="SMANS Handtekening" 
                className="max-w-xs h-24 object-contain"
              />
              <p className="text-sm text-gray-600 mt-2">Namens SMANS BV</p>
            </div>
          </div>
        )}

        {/* Client Signature Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {isSigned ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Offerte Goedgekeurd</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Ondertekend door:</h4>
                  <p className="text-gray-900 font-medium">{quote.client_name}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(quote.client_signed_at), 'dd MMMM yyyy HH:mm', { locale: nl })}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Handtekening:</h4>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img 
                      src={quote.client_signature_data} 
                      alt="Klant handtekening" 
                      className="max-w-xs h-24 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {isExpired ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Offerte Verlopen</h3>
                  <p className="text-gray-600">Deze offerte is verlopen en kan niet meer worden ondertekend.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Neem contact op met SMANS BV voor een nieuwe offerte.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Offerte Goedkeuren</h3>
                  <p className="text-gray-600 mb-6">
                    Door deze offerte digitaal te ondertekenen gaat u akkoord met de voorwaarden en prijzen zoals vermeld.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="clientName">Naam ondertekenaar *</Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Vul uw volledige naam in"
                        className="mt-1"
                      />
                    </div>

                    <SignatureCanvas
                      title="Uw handtekening"
                      onSignature={setClientSignature}
                    />

                    <Button 
                      onClick={handleSignQuote}
                      disabled={!clientName.trim() || !clientSignature || signing}
                      className="w-full"
                      size="lg"
                    >
                      {signing ? "Bezig met ondertekenen..." : "Offerte Goedkeuren"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 SMANS BV - Alle rechten voorbehouden</p>
        </div>
      </div>
    </div>
  );
}
