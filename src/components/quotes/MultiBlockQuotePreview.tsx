
import React, { useState, useEffect, useRef } from 'react';
import { Quote } from '@/types/quote';
import { QuoteAttachment } from './FileAttachmentsManager';
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

interface MultiBlockQuotePreviewProps {
  quote: Quote;
  attachments?: QuoteAttachment[];
}

export const MultiBlockQuotePreview: React.FC<MultiBlockQuotePreviewProps> = ({ quote, attachments = [] }) => {
  const [settings, setSettings] = useState<QuoteSettings>({});
  const [printLoading, setPrintLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Track quote changes
  useEffect(() => {
    // Quote updated
  }, [quote]);

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
   * Uses html2pdf.js from Context7 MCP
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
        filename: `Offerte-${quote.quote_number || 'onbekend'}.pdf`,
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
   * Uses html2pdf.js from Context7 MCP
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
      setIsGeneratingPDF(true); // Show all content for PDF generation
      
      // Wait for DOM to update with full content visibility
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await generateAndDownloadPDF(
        previewRef.current,
        `Offerte-${quote.quote_number || 'onbekend'}.pdf`,
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

  /**
   * Generate PDF, upload to Supabase Storage, and update quote record
   * Uses html2pdf.js from Context7 MCP
   */
  const handleUploadPDF = async () => {
    if (!previewRef.current) {
      toast({
        title: "Fout",
        description: "Preview element niet gevonden",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadLoading(true);
      
      const filename = `quote-${quote.id}-${Date.now()}.pdf`;
      const storagePath = `quotes/${filename}`;

      // Generate and upload PDF
      const { url } = await generatePDFWithUpload(
        previewRef.current,
        'documents',
        storagePath,
        {
          margin: [10, 10, 10, 10],
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compressPDF: true },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['img', 'table', '.avoid-break'] },
        }
      );

      // Update quote record with PDF URL
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ pdf_url: url })
        .eq('id', quote.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "PDF Opgeslagen",
        description: "PDF is succesvol opgeslagen in Supabase Storage",
      });

      // Open PDF in new tab
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "Fout bij PDF opslaan",
        description: error.message || "Er ging iets mis bij het opslaan van de PDF.",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
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
          <h2 className="text-xl font-bold text-gray-900 mb-1">OFFERTE</h2>
          <p className="text-base font-medium text-smans-primary">{quote.quote_number}</p>
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
            <p className="font-medium">{quote.customer_name}</p>
            {quote.project_title && (
              <p className="mt-2 text-smans-primary">Project: {quote.project_title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quote details */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-700">Offertedatum</h4>
          <p className="text-sm text-gray-600">{new Date(quote.quote_date).toLocaleDateString('nl-NL')}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Geldig tot</h4>
          <p className="text-sm text-gray-600">{new Date(quote.valid_until).toLocaleDateString('nl-NL')}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Status</h4>
          <p className="text-sm text-gray-600 capitalize">{quote.status}</p>
        </div>
      </div>

      {/* Message */}
      {quote.message && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Bericht:</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">{quote.message}</p>
        </div>
      )}

      {/* Quote blocks - ENHANCED VISIBILITY */}
      <div className="space-y-1 mb-4">
        {quote.blocks && quote.blocks.length > 0 ? (
          <>
            <div className="mb-3">
              <h3 className="text-xl font-bold text-gray-900 mb-2">OFFERTEONDERDELEN</h3>
              <div className="w-full h-1 bg-gradient-to-r from-smans-primary to-transparent rounded"></div>
            </div>
            {(() => {
              const productBlocks = quote.blocks.filter(b => b.type === 'product');
              let productBlockIndex = 0;
              
              return quote.blocks.map((block, blockIndex) => {
                if (block.type === 'textblock') {
                  // Simple text block - no borders, no padding, just text
                  return (
                    <div key={`${block.id}-${blockIndex}`} className="my-4">
                      <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                        {block.content || 'Geen tekst ingevoerd'}
                      </div>
                    </div>
                  );
                }
                
                // Product block with borders and structure
                productBlockIndex++;
                return (
                  <div key={`${block.id}-${blockIndex}`} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm mb-2">
                    {/* Block Title - only for product blocks */}
                    <div className="mb-2 pb-1 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {block.title}
                      </h3>
                      <div className="text-xs text-gray-500">
                        Onderdeel {productBlockIndex} van {productBlocks.length}
                      </div>
                    </div>
                    
                     {/* Product Block Content */}
                    {block.items && block.items.length > 0 ? (
                         <div className="mb-2">
                           {/* Table with mixed content */}
                           <div className="bg-gray-50 rounded border">
                              {/* Table header (only show if there are products) */}
                              {block.items.some(item => item.type === 'product') && (
                                <div className="grid grid-cols-12 gap-4 py-1 px-3 bg-gray-100 border-b font-medium text-gray-700 text-xs">
                                 <div className="col-span-6">Beschrijving</div>
                                 <div className="col-span-2 text-center">Aantal</div>
                                 <div className="col-span-2 text-right">Prijs</div>
                                 <div className="col-span-1 text-center">BTW%</div>
                                 <div className="col-span-1 text-right">Totaal</div>
                               </div>
                             )}
                             
                              {/* All items in original order */}
                              {block.items.map((item, itemIndex) => (
                                item.type === 'product' ? (
                                  <div key={`product-${item.id || itemIndex}`} className="grid grid-cols-12 gap-4 py-1 px-3 border-b border-gray-100 text-xs">
                                   <div className="col-span-6 text-gray-800">{item.description || 'Geen beschrijving'}</div>
                                   <div className="col-span-2 text-center text-gray-800">{item.quantity || 0}</div>
                                   <div className="col-span-2 text-right text-gray-800">€{(item.unit_price || 0).toFixed(2)}</div>
                                   <div className="col-span-1 text-center text-gray-800">{item.vat_rate || 0}%</div>
                                   <div className="col-span-1 text-right text-gray-800 font-medium">€{(item.total || 0).toFixed(2)}</div>
                                 </div>
                               ) : (
                                 <div key={`text-${item.id || itemIndex}`} className="col-span-12 px-3 py-2 border-b border-gray-100">
                                   <div 
                                     className="text-gray-700 whitespace-pre-line text-sm italic" 
                                     style={getItemStyle(item)}
                                   >
                                     {item.description || 'Geen tekst'}
                                   </div>
                                 </div>
                               )
                             ))}
                           </div>
                         </div>
                     ) : (
                       <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300">
                         <div className="text-yellow-800 font-medium mb-2 text-lg">⚠️ Geen items toegevoegd</div>
                         <div className="text-yellow-700">
                           Dit blok is leeg. Voeg producten of diensten toe om ze hier te zien in de offerte.
                         </div>
                       </div>
                     )}

                    {/* Block totals (only if block has products) */}
                    {block.items && block.items.some(item => item.type === 'product') && (
                      <div className="flex justify-end mt-2">
                        <div className="w-60 bg-gray-50 rounded border p-2">
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotaal {block.title}:</span>
                              <span className="font-medium">€{(block.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">BTW ({block.items.find(item => item.type === 'product')?.vat_rate || 21}%):</span>
                              <span className="font-medium">€{(block.vat_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2">
                              <div className="flex justify-between">
                                <span className="font-semibold text-gray-900">Totaal {block.title}:</span>
                                <span className="font-semibold text-gray-900">
                                  €{((block.subtotal || 0) + (block.vat_amount || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </>
        ) : (
          <div className="text-gray-400 italic text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-xl font-medium mb-3">Geen blokken toegevoegd aan deze offerte</div>
            <div className="text-base">Voeg eerst blokken toe om ze hier te zien</div>
          </div>
        )}
      </div>

      {/* Grand totals */}
      <div className="flex justify-end border-t-2 border-gray-200 pt-3 bg-gray-50 rounded-lg p-3 mt-4">
        <div className="w-72 space-y-1">
          <div className="flex justify-between py-1 text-base">
            <span className="font-bold text-gray-900">Totaal excl. BTW:</span>
            <span className="font-bold">€{(quote.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 text-base">
            <span className="font-bold text-gray-900">Totaal BTW:</span>
            <span className="font-bold">€{(quote.total_vat_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-300">
            <span className="font-bold text-xl text-gray-900">EINDTOTAAL:</span>
            <span className="font-bold text-xl text-smans-primary">
              €{((quote.total_amount || 0) + (quote.total_vat_amount || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Signatures Section - Always show if quote is approved or if signatures exist */}
      {(quote.status === 'goedgekeurd' || quote.status === 'approved' || quote.client_signature_data || quote.admin_signature_data) && (
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">HANDTEKENINGEN</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Client Signature */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Klant Handtekening</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                {quote.client_signature_data ? (
                  <>
                    <img 
                      src={quote.client_signature_data} 
                      alt="Klant handtekening" 
                      className="max-w-full h-24 object-contain mb-3 bg-white p-2 rounded"
                    />
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Naam:</strong> {quote.client_name || 'Niet opgegeven'}</p>
                      {quote.client_signed_at && (
                        <p><strong>Ondertekend op:</strong> {new Date(quote.client_signed_at).toLocaleDateString('nl-NL', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })} om {new Date(quote.client_signed_at).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      )}
                    </div>
                    {(quote.status === 'approved' || quote.status === 'goedgekeurd') && (
                      <div className="mt-3 p-2 bg-green-100 text-green-800 text-xs rounded font-medium flex items-center gap-2">
                        <span>✅</span>
                        <span>Goedgekeurd door klant</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Nog niet ondertekend</p>
                    {(quote.status === 'goedgekeurd' || quote.status === 'approved') && (
                      <p className="text-xs mt-2 text-green-600">✅ Wel goedgekeurd</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Signature */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">{settings.company_name || 'SMANS BV'}</h4>
              <div className="border rounded-lg p-4 bg-gray-50">
                {quote.admin_signature_data ? (
                  <>
                    <img 
                      src={quote.admin_signature_data} 
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
          <p><strong>Deze offerte is geldig tot {new Date(quote.valid_until).toLocaleDateString('nl-NL')}.</strong></p>
          <p>Door akkoord te gaan met deze offerte gaat u een overeenkomst aan met {settings.company_name || 'SMANS BV'} onder de hieronder vermelde voorwaarden.</p>
          <p>Prijzen zijn inclusief BTW tenzij anders vermeld. Bij aanvaarding van deze offerte zijn onze algemene voorwaarden van toepassing.</p>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Akkoord verklaring:</h4>
          <p className="text-sm text-gray-600">
            Door digitaal te ondertekenen gaat u akkoord met de voorwaarden en prijzen zoals vermeld in deze offerte.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            <a href="/algemene-voorwaarden" className="underline hover:text-gray-700">
              Lees onze algemene voorwaarden
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};
