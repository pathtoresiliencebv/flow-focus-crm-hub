
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { publicSupabase } from "@/integrations/supabase/publicClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Check, FileText, Calendar, User, Download, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Quote, QuoteBlock, QuoteItem } from '@/types/quote';
import { generateUUID } from '@/utils/uuid';

interface QuoteSettings {
  terms_and_conditions?: string;
  company_name?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_vat_number?: string;
  company_kvk_number?: string;
}

interface QuoteAttachment {
  name: string;
  url: string;
  size?: number;
}

export default function PublicQuote() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<QuoteSettings>({});
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientSignature, setClientSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [attachments, setAttachments] = useState<QuoteAttachment[]>([]);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetchQuote();
      fetchSettings();
    }
  }, [token]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await publicSupabase
        .from('quote_settings')
        .select('*')
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows gracefully

      if (error) {
        console.warn('Could not fetch quote settings (using defaults):', error);
        // Continue with empty settings - component will use defaults
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.warn('Error fetching settings (using defaults):', error);
      // Continue with empty settings - component will use defaults
    }
  };

  const fetchQuote = async () => {
    console.log('🔍 Fetching public quote with token:', token);
    try {
      const { data, error } = await publicSupabase
        .from('quotes')
        .select('*')
        .eq('public_token', token)
        .single();

      console.log('Quote fetch response:', { data, error });

      if (error) {
        console.error('Error fetching quote:', error);
        toast({
          title: "Offerte niet gevonden",
          description: "De opgevraagde offerte kon niet worden gevonden.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!data) {
        console.error('No quote data received');
        toast({
          title: "Offerte niet gevonden",
          description: "De opgevraagde offerte kon niet worden gevonden.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('Raw quote data:', data);
      console.log('Raw items:', data.items);

      // Convert the data to Quote format
      let blocks: QuoteBlock[] = [];
      try {
        if (data.items && Array.isArray(data.items)) {
          console.log('Processing blocks from items array');
          blocks = data.items.map((item: any, index: number) => {
            console.log(`Processing block ${index}:`, item);
            return {
              id: item.id || generateUUID(),
              title: item.title || 'Untitled Block',
              type: item.type || 'product',
              items: item.items || [],
              subtotal: item.subtotal || 0,
              vat_amount: item.vat_amount || 0,
              order_index: item.order_index || index,
              content: item.content
            };
          });
        } else {
          console.log('No items array found, setting empty blocks');
          blocks = [];
        }
      } catch (e) {
        console.error('Error parsing quote blocks:', e);
        blocks = [];
      }

      console.log('Parsed blocks:', blocks);

      const typedQuote: Quote = {
        ...data,
        blocks,
        total_vat_amount: data.vat_amount || 0
      };

      console.log('Final typed quote:', typedQuote);
      setQuote(typedQuote);
      
      // Fetch customer data if customer_id exists
      if (data.customer_id) {
        try {
          const { data: customerInfo, error: customerError } = await publicSupabase
            .from('customers')
            .select('*')
            .eq('id', data.customer_id)
            .maybeSingle();
          
          if (customerInfo && !customerError) {
            console.log('Fetched customer data:', customerInfo);
            setCustomerData(customerInfo);
          }
        } catch (e) {
          console.warn('Could not fetch customer data:', e);
        }
      } else if (data.customer_email) {
        // Fallback: try to find customer by email if no customer_id
        try {
          const { data: customerInfo, error: customerError } = await publicSupabase
            .from('customers')
            .select('*')
            .eq('email', data.customer_email)
            .maybeSingle();
          
          if (customerInfo && !customerError) {
            console.log('Fetched customer data by email fallback:', customerInfo);
            setCustomerData(customerInfo);
          }
        } catch (e) {
          console.warn('Could not fetch customer data by email fallback:', e);
        }
      }
      
      // Parse attachments if available
      if (data.attachments) {
        try {
          const parsedAttachments = typeof data.attachments === 'string' 
            ? JSON.parse(data.attachments) 
            : data.attachments;
          console.log('📎 Loaded attachments:', parsedAttachments);
          setAttachments(Array.isArray(parsedAttachments) ? parsedAttachments : []);
        } catch (err) {
          console.error('Error parsing attachments:', err);
          setAttachments([]);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
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

    // Prevent re-signing if already approved
    if (quote?.status === 'approved') {
      toast({
        title: "Offerte al goedgekeurd",
        description: "Deze offerte is al goedgekeurd en ondertekend.",
        variant: "destructive",
      });
      return;
    }

    setSigning(true);
    try {
      const { error } = await publicSupabase
        .from('quotes')
        .update({
          client_signature_data: clientSignature,
          client_signed_at: new Date().toISOString(),
          client_name: clientName.trim(),
          status: 'approved'
        })
        .eq('public_token', token)
        .neq('status', 'approved'); // Additional safety check

      if (error) {
        console.error('Error signing quote:', error);
        toast({
          title: "Fout bij ondertekenen",
          description: "Er is een fout opgetreden bij het ondertekenen van de offerte.",
          variant: "destructive",
        });
        return;
      }

      // Trigger the automation workflow
      try {
        const { error: automationError } = await publicSupabase.functions.invoke('quote-approval-automation', {
          body: { quote_id: quote?.id }
        });

        if (automationError) {
          console.error('Automation error:', automationError);
        }
      } catch (automationError) {
        console.error('Automation invocation error:', automationError);
      }

      toast({
        title: "Offerte ondertekend!",
        description: "De offerte is succesvol ondertekend. We hebben automatisch een project aangemaakt.",
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

  const handleDownloadPdf = async () => {
    try {
      if (!quote) return;

      console.log('📄 Downloading PDF for quote:', quote.id);
      
      // Use the same PDF generation as the admin
      // Call the Edge Function to get HTML content
      const { data, error: invokeError } = await publicSupabase.functions.invoke('generate-quote-pdf', {
        body: { quoteId: quote.id }
      });

      if (invokeError || !data?.htmlContent) {
        console.error('Error invoking generate-quote-pdf:', invokeError);
        toast({
          title: "Fout",
          description: "Kon PDF niet genereren. Probeer het later opnieuw.",
          variant: "destructive",
        });
        return;
      }

      // Convert HTML to PDF using html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `Offerte-${quote.quote_number || 'onbekend'}.pdf`;
      const opt = {
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compressPDF: true },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['img', 'table', '.avoid-break'] },
      } as any;

      // Create element from HTML string
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      await (html2pdf() as any).set(opt).from(tempDiv).save();
      document.body.removeChild(tempDiv);

      toast({
        title: "PDF gedownload",
        description: "De offerte PDF is succesvol gedownload.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het downloaden van de PDF.",
        variant: "destructive",
      });
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

  const getItemStyle = (item: QuoteItem) => {
    if (item.type === 'textblock' && item.formatting) {
      let style: React.CSSProperties = {};
      if (item.formatting.bold) style.fontWeight = 'bold';
      if (item.formatting.italic) style.fontStyle = 'italic';
      if (item.formatting.underline) style.textDecoration = 'underline';
      return style;
    }
    return {};
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
        
        {/* Success Banner for Approved Quotes */}
        {quote.status === 'approved' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <Check className="h-6 w-6 mr-2" />
              <div>
                <h3 className="font-bold text-lg">Deze offerte is goedgekeurd!</h3>
                <p className="text-sm">Ondertekend op {format(new Date(quote.client_signed_at!), 'dd MMMM yyyy', { locale: nl })} door {quote.client_name}</p>
              </div>
            </div>
            <Button 
              onClick={handleDownloadPdf}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        )}
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
                <p className="font-medium">{settings.company_name || 'SMANS BV'}</p>
                <p>{settings.company_address || 'Bedrijfsstraat 123'}</p>
                <p>{settings.company_postal_code || '1234 AB'} {settings.company_city || 'Amsterdam'}</p>
                <p>{settings.company_country || 'Nederland'}</p>
                <p className="mt-2">BTW: {settings.company_vat_number || 'NL123456789B01'}</p>
                <p>KvK: {settings.company_kvk_number || '12345678'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Aan:</h3>
              <div className="text-sm text-gray-600">
                {customerData?.company_name && (
                  <p className="font-medium text-gray-900">{customerData.company_name}</p>
                )}
                <p className="font-medium">{quote.customer_name}</p>
                {customerData?.contact_person && <p className="text-xs text-gray-500">t.a.v. {customerData.contact_person}</p>}
                {quote.customer_email && <p>{quote.customer_email}</p>}
                {customerData?.phone && <p>{customerData.phone}</p>}
                {customerData?.address && <p>{customerData.address}</p>}
                {customerData?.country && <p>{customerData.country}</p>}
                {customerData?.kvk_number && <p className="mt-2 text-xs">KvK: {customerData.kvk_number}</p>}
                {customerData?.vat_number && <p className="text-xs">BTW: {customerData.vat_number}</p>}
                {quote.project_title && (
                  <p className="mt-2 text-smans-primary font-medium">Project: {quote.project_title}</p>
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

        {/* Quote Blocks */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h3 className="text-lg font-semibold mb-4">Offerteregels</h3>
          
          {quote.blocks && quote.blocks.length > 0 ? (
            <div className="space-y-8">
              {quote.blocks.map((block, blockIndex) => (
                <div key={`${block.id}-${blockIndex}`}>
                  {block.type === 'textblock' ? (
                    /* Text Block Rendering */
                    <div className="mb-8">
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm p-4 bg-gray-50 rounded-lg">
                        {block.content || 'Geen tekst ingevoerd'}
                      </div>
                    </div>
                  ) : (
                    /* Product Block Rendering */
                    <div className="border-l-2 border-gray-300 pl-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 uppercase">{block.title}</h4>
                      
                      {block.items && block.items.length > 0 ? (
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
                              {block.items.map((item, itemIndex) => (
                                <tr key={`${item.id || itemIndex}-${blockIndex}-${itemIndex}`} className="border-b border-gray-100">
                                  {item.type === 'product' ? (
                                    <>
                                      <td className="py-3 text-gray-800">{item.description}</td>
                                      <td className="py-3 text-center text-gray-800">{item.quantity}</td>
                                      <td className="py-3 text-right text-gray-800">€{(item.unit_price || 0).toFixed(2)}</td>
                                      <td className="py-3 text-center text-gray-800">{item.vat_rate}%</td>
                                      <td className="py-3 text-right text-gray-800 font-medium">€{(item.total || 0).toFixed(2)}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-3 text-gray-800 whitespace-pre-line" style={getItemStyle(item)}>
                                        {item.description}
                                      </td>
                                      <td className="py-3 text-center text-gray-400">-</td>
                                      <td className="py-3 text-right text-gray-400">-</td>
                                      <td className="py-3 text-center text-gray-800">{item.vat_rate}%</td>
                                      <td className="py-3 text-right text-gray-400">-</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-gray-400 italic py-4">Geen items in dit blok</div>
                      )}

                      {/* Block totals (only if block has products) */}
                      {block.items && block.items.some(item => item.type === 'product') && (
                        <div className="flex justify-end mt-4">
                          <div className="w-64 space-y-1 text-sm border-t pt-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotaal {block.title}:</span>
                              <span className="font-medium">€{(block.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">BTW:</span>
                              <span className="font-medium">€{(block.vat_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-t">
                              <span className="font-semibold">Totaal {block.title}:</span>
                              <span className="font-semibold text-smans-primary">
                                €{((block.subtotal || 0) + (block.vat_amount || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 italic text-center py-8">
              Geen items in deze offerte
            </div>
          )}

          {/* Grand totals */}
          <div className="flex justify-end border-t-2 border-gray-200 pt-4 mt-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-1 text-lg">
                <span className="font-semibold text-gray-900">Totaal excl. BTW:</span>
                <span className="font-semibold">€{(quote.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-lg">
                <span className="font-semibold text-gray-900">Totaal BTW:</span>
                <span className="font-semibold">€{(quote.total_vat_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-200">
                <span className="font-bold text-xl">EINDTOTAAL:</span>
                <span className="font-bold text-xl text-smans-primary">
                  €{((quote.total_amount || 0) + (quote.total_vat_amount || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments/Bijlagen */}
        {attachments && attachments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold">Bijlagen</h3>
            </div>
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{attachment.name}</p>
                      {attachment.size && (
                        <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // Prefer direct download via anchor with download attribute
                        const link = document.createElement('a');
                        link.href = attachment.url;
                        link.download = attachment.name || 'bijlage';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (e) {
                        // Fallback: open in new tab
                        window.open(attachment.url, '_blank');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        {settings.terms_and_conditions && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h3 className="text-lg font-semibold mb-4">Algemene Voorwaarden</h3>
            <div className="text-sm text-gray-600 whitespace-pre-line">
              {settings.terms_and_conditions}
            </div>
          </div>
        )}

        {/* Admin Signature */}
        {quote.admin_signature_data && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <h3 className="text-lg font-semibold mb-4">{settings.company_name || 'SMANS BV'}</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img 
                src={quote.admin_signature_data} 
                alt="SMANS Handtekening" 
                className="max-w-xs h-24 object-contain"
              />
              <p className="text-sm text-gray-600 mt-2">Namens {settings.company_name || 'SMANS BV'}</p>
            </div>
          </div>
        )}

        {/* Client Signature Section */}
        {quote.status === 'approved' || isSigned || quote.client_signature_data ? (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            {quote.client_signature_data ? (
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
                    Neem contact op met {settings.company_name || 'SMANS BV'} voor een nieuwe offerte.
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
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8">
            {isExpired ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Offerte Verlopen</h3>
                  <p className="text-gray-600">Deze offerte is verlopen en kan niet meer worden ondertekend.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Neem contact op met {settings.company_name || 'SMANS BV'} voor een nieuwe offerte.
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

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 {settings.company_name || 'SMANS BV'} - Alle rechten voorbehouden</p>
        </div>
      </div>
    </div>
  );
}
