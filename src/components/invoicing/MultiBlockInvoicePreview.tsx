
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  generateAndOpenPDF, 
  generateAndDownloadPDF,
  generatePDFWithUpload 
} from '@/utils/pdfGenerationService';

interface InvoiceSettings {
  terms_and_conditions?: string;
  company_name?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_vat_number?: string;
  company_kvk_number?: string;
}

interface MultiBlockInvoicePreviewProps {
  invoice: any;
  attachments?: any[];
}

export const MultiBlockInvoicePreview: React.FC<MultiBlockInvoicePreviewProps> = ({ invoice, attachments = [] }) => {
  const [settings, setSettings] = useState<InvoiceSettings>({});
  const [printLoading, setPrintLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_settings')
        .select('*')
        .single();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  /**
   * Open PDF in new browser tab
   */
  const handleOpenPDF = async () => {
    if (!previewRef.current) {
      toast({
        title: "Fout",
        description: "Preview element niet gevonden",
        variant: "destructive",
      });
      return;
    }

    try {
      setPrintLoading(true);
      
      await generateAndOpenPDF(previewRef.current, {
        filename: `Factuur-${invoice.invoice_number || 'onbekend'}.pdf`,
        margin: [10, 10, 10, 10],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compressPDF: true },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['img', 'table', '.avoid-break'] },
      });

      toast({
        title: "PDF Geopend",
        description: "PDF wordt geopend in nieuw tabblad",
      });
    } catch (error: any) {
      console.error('Error opening PDF:', error);
      toast({
        title: "Fout bij PDF openen",
        description: error.message || "Er ging iets mis bij het genereren van de PDF.",
        variant: "destructive",
      });
    } finally {
      setPrintLoading(false);
    }
  };

  /**
   * Download PDF to local file system
   */
  const handleDownloadPDF = async () => {
    if (!previewRef.current) {
      toast({
        title: "Fout",
        description: "Preview element niet gevonden",
        variant: "destructive",
      });
      return;
    }

    try {
      setDownloadLoading(true);
      setIsGeneratingPDF(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await generateAndDownloadPDF(
        previewRef.current,
        `Factuur-${invoice.invoice_number || 'onbekend'}.pdf`,
        {
          margin: [10, 10, 10, 10],
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            scrollY: 0,
            scrollX: 0,
            windowHeight: previewRef.current.scrollHeight,
            logging: false
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compressPDF: true },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['img', 'table', '.avoid-break'] },
        }
      );

      toast({
        title: "PDF Gedownload",
        description: "PDF is succesvol gedownload",
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Fout bij PDF downloaden",
        description: error.message || "Er ging iets mis bij het downloaden van de PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloadLoading(false);
      setIsGeneratingPDF(false);
    }
  };

  const getItemStyle = (item: any) => {
    if (item.type === 'textblock' && item.formatting) {
      let style: React.CSSProperties = {};
      if (item.formatting.bold) style.fontWeight = 'bold';
      if (item.formatting.italic) style.fontStyle = 'italic';
      if (item.formatting.underline) style.textDecoration = 'underline';
      return style;
    }
    return {};
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* PDF Actions Header */}
      <div className="flex justify-end gap-2 p-4 border-b print:hidden">
        <Button 
          onClick={handleDownloadPDF}
          disabled={downloadLoading}
          variant="default"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {downloadLoading ? 'Downloaden...' : 'Download PDF'}
        </Button>
      </div>
      
      <div 
        ref={previewRef} 
        className={cn(
          "p-2 text-xs",
          isGeneratingPDF 
            ? "max-h-none overflow-visible" 
            : "max-h-[70vh] overflow-y-auto",
          "print:max-h-none print:overflow-visible"
        )}
      >
      {/* Header with logo and company info */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
            alt="SMANS Logo" 
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-900 mb-1">FACTUUR</h2>
          <p className="text-base font-medium text-smans-primary">{invoice.invoice_number}</p>
        </div>
      </div>

      {/* Company and customer info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Van:</h3>
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
          <h3 className="font-semibold text-gray-900 mb-2">Aan:</h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{invoice.customer_name || 'Klant naam niet beschikbaar'}</p>
            {invoice.project_title && (
              <p className="mt-2 text-smans-primary">Project: {invoice.project_title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice details */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-700">Factuurdatum</h4>
          <p className="text-sm text-gray-600">{new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Vervaldatum</h4>
          <p className="text-sm text-gray-600">{new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Status</h4>
          <p className="text-sm text-gray-600 capitalize">
            {invoice.payment_status === 'paid' ? 'Betaald' : invoice.payment_status === 'pending' ? 'Te betalen' : invoice.payment_status}
          </p>
        </div>
      </div>

      {/* Message */}
      {invoice.notes && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Opmerking:</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}

      {/* Invoice items */}
      <div className="space-y-1 mb-4">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-gray-900 mb-2">FACTUURREGELS</h3>
          <div className="w-full h-1 bg-gradient-to-r from-smans-primary to-transparent rounded"></div>
        </div>
        
        {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm mb-2">
            <div className="mb-2">
              {/* Table with items */}
              <div className="bg-gray-50 rounded border">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-4 py-1 px-3 bg-gray-100 border-b font-medium text-gray-700 text-xs">
                  <div className="col-span-6">Beschrijving</div>
                  <div className="col-span-2 text-center">Aantal</div>
                  <div className="col-span-2 text-right">Prijs</div>
                  <div className="col-span-1 text-center">BTW%</div>
                  <div className="col-span-1 text-right">Totaal</div>
                </div>
                
                {/* All items */}
                {invoice.invoice_items.map((item: any, itemIndex: number) => (
                  <div key={`item-${item.id || itemIndex}`} className="grid grid-cols-12 gap-4 py-1 px-3 border-b border-gray-100 text-xs">
                    <div className="col-span-6 text-gray-800">{item.description || 'Geen beschrijving'}</div>
                    <div className="col-span-2 text-center text-gray-800">{item.quantity || 0}</div>
                    <div className="col-span-2 text-right text-gray-800">€{(item.unit_price || 0).toFixed(2)}</div>
                    <div className="col-span-1 text-center text-gray-800">{item.vat_rate || 0}%</div>
                    <div className="col-span-1 text-right text-gray-800 font-medium">€{(item.total || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 italic text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-xl font-medium mb-3">Geen factuurregels toegevoegd</div>
            <div className="text-base">Voeg eerst factuurregels toe om ze hier te zien</div>
          </div>
        )}
      </div>

      {/* Grand totals */}
      <div className="flex justify-end border-t-2 border-gray-200 pt-3 bg-gray-50 rounded-lg p-3 mt-4">
        <div className="w-72 space-y-1">
          <div className="flex justify-between py-1 text-base">
            <span className="font-bold text-gray-900">Totaal excl. BTW:</span>
            <span className="font-bold">€{(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 text-base">
            <span className="font-bold text-gray-900">Totaal BTW:</span>
            <span className="font-bold">€{(invoice.vat_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-300">
            <span className="font-bold text-xl text-gray-900">TE BETALEN:</span>
            <span className="font-bold text-xl text-smans-primary">
              €{(invoice.total_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment status badge */}
      {(invoice.payment_status === 'paid' || invoice.status === 'paid') && (
        <div className="mt-8 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-bold text-green-900 text-lg">BETAALD</p>
              {invoice.paid_at && (
                <p className="text-sm text-green-700">
                  Betaald op {new Date(invoice.paid_at).toLocaleDateString('nl-NL', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signatures Section - Always show if invoice is paid or if signatures exist */}
      {(invoice.payment_status === 'paid' || invoice.status === 'paid' || invoice.client_signature_data || invoice.admin_signature_data) && (
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">HANDTEKENINGEN</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Client Signature */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Klant Handtekening</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                {invoice.client_signature_data ? (
                  <>
                    <img 
                      src={invoice.client_signature_data} 
                      alt="Klant handtekening" 
                      className="max-w-full h-24 object-contain mb-3 bg-white p-2 rounded"
                    />
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Naam:</strong> {invoice.client_name || 'Niet opgegeven'}</p>
                      {invoice.client_signed_at && (
                        <p><strong>Ondertekend op:</strong> {new Date(invoice.client_signed_at).toLocaleDateString('nl-NL', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })} om {new Date(invoice.client_signed_at).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      )}
                    </div>
                    {(invoice.payment_status === 'paid' || invoice.status === 'paid') && (
                      <div className="mt-3 p-2 bg-green-100 text-green-800 text-xs rounded font-medium flex items-center gap-2">
                        <span>✅</span>
                        <span>Betaald</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Nog niet ondertekend</p>
                    {(invoice.payment_status === 'paid' || invoice.status === 'paid') && (
                      <p className="text-xs mt-2 text-green-600">✅ Wel betaald</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Signature */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">{settings.company_name || 'SMANS BV'}</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                {invoice.admin_signature_data ? (
                  <>
                    <img 
                      src={invoice.admin_signature_data} 
                      alt="Bedrijf handtekening" 
                      className="max-w-full h-24 object-contain mb-3 bg-white p-2 rounded"
                    />
                    <p className="text-sm text-gray-600">Namens {settings.company_name || 'SMANS BV'}</p>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Nog niet ondertekend</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Attachments Display */}
      {attachments && attachments.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">BIJLAGEN</h3>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PDF</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                  <p className="text-xs text-gray-500">
                    {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(1)} MB` : 'Bijlage'}
                  </p>
                </div>
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                >
                  Bekijken
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Graag het verschuldigde bedrag binnen {invoice.payment_term || 14} dagen overmaken op rekeningnummer:</strong></p>
          <p className="font-mono bg-gray-50 p-2 rounded border">NL00 BANK 0123 4567 89</p>
          <p>T.n.v. {settings.company_name || 'SMANS BV'}</p>
          <p>Onder vermelding van factuurnummer: {invoice.invoice_number}</p>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            Deze factuur is gegenereerd door {settings.company_name || 'SMANS BV'}.
            Bij vragen kunt u contact met ons opnemen.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};
