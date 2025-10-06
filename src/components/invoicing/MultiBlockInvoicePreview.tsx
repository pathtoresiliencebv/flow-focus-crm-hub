import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import html2pdf from 'html2pdf.js'; // Temporarily disabled for build

interface InvoiceSettings {
  company_name?: string;
  company_address?: string;
  company_postal_code?: string;
  company_city?: string;
  company_country?: string;
  company_vat_number?: string;
  company_kvk_number?: string;
}

interface MultiBlockInvoicePreviewProps {
  invoice: {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_email?: string;
    project_title?: string;
    invoice_date: string;
    due_date: string;
    message?: string;
    blocks: Array<{
      id: string;
      title: string;
      type: 'product' | 'textblock';
      items: Array<{
        id: string;
        type: 'product' | 'textblock';
        description: string;
        quantity?: number;
        unit_price?: number;
        vat_rate: number;
        total?: number;
        formatting?: {
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
        };
      }>;
      subtotal: number;
      vat_amount: number;
      content?: string;
    }>;
    total_amount: number;
    total_vat_amount: number;
    status: string;
    payment_terms?: Array<{
      id: string;
      percentage: number;
      description: string;
      daysAfter?: number;
    }>;
  };
}

export const MultiBlockInvoicePreview: React.FC<MultiBlockInvoicePreviewProps> = ({ invoice }) => {
  const [settings, setSettings] = useState<InvoiceSettings>({});
  const [printLoading, setPrintLoading] = useState(false);
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

  const handlePrint = async () => {
    try {
      setPrintLoading(true);
      const filename = `Factuur-${invoice.invoice_number || 'onbekend'}.pdf`;
      
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId: invoice.id }
      });

      if (error) throw error;

      if (data?.success && data?.htmlContent) {
        // Create a temporary container for html2pdf
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // PDF options
        const opt = {
          margin: [10, 10, 10, 10] as [number, number, number, number],
          filename: filename,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        // Generate PDF and open in new tab
        // Temporarily use print functionality instead of PDF generation
        console.log('PDF generation temporarily disabled - using print instead');
        
        // Clean up temp div
        document.body.removeChild(tempDiv);
        
        // Use browser print functionality as fallback
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Factuur Print</title></head>
              <body>${tempDiv.innerHTML}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
        
        toast({
          title: "Print Geopend! ✓",
          description: "De factuur is geopend voor printen.",
        });
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast({
        title: "Fout bij PDF openen",
        description: "Er ging iets mis bij het genereren van de PDF.",
        variant: "destructive",
      });
    } finally {
      setPrintLoading(false);
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
      {/* Print Button Header */}
      <div className="flex justify-end p-4 border-b print:hidden">
        <Button 
          onClick={handlePrint}
          disabled={printLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          {printLoading ? 'Genereren...' : 'Print PDF'}
        </Button>
      </div>
      
      <div className="p-2 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible text-xs">
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
            <p className="font-medium">{invoice.customer_name}</p>
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
          <p className="text-sm text-gray-600 capitalize">{invoice.status}</p>
        </div>
      </div>

      {/* Message */}
      {invoice.message && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Bericht:</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.message}</p>
        </div>
      )}

      {/* Invoice blocks */}
      <div className="space-y-1 mb-4">
        {invoice.blocks && invoice.blocks.length > 0 ? (
          <>
            <div className="mb-3">
              <h3 className="text-xl font-bold text-gray-900 mb-2">FACTUURONDERDELEN</h3>
              <div className="w-full h-1 bg-gradient-to-r from-smans-primary to-transparent rounded"></div>
            </div>
            {(() => {
              const productBlocks = invoice.blocks.filter(b => b.type === 'product');
              let productBlockIndex = 0;
              
              return invoice.blocks.map((block, blockIndex) => {
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
                           Dit blok is leeg. Voeg producten of diensten toe om ze hier te zien in de factuur.
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
            <div className="text-xl font-medium mb-3">Geen blokken toegevoegd aan deze factuur</div>
            <div className="text-base">Voeg eerst blokken toe om ze hier te zien</div>
          </div>
        )}
      </div>

      {/* Payment Terms */}
      {invoice.payment_terms && invoice.payment_terms.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Betalingstermijnen:</h4>
          <div className="space-y-1">
            {invoice.payment_terms.map((term, index) => (
              <div key={term.id || index} className="flex justify-between text-xs">
                <span>{term.description}</span>
                <span className="font-medium">{term.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grand totals */}
      <div className="flex justify-end border-t-2 border-gray-200 pt-3 bg-gray-50 rounded-lg p-3 mt-4">
        <div className="w-72 space-y-1">
          <div className="flex justify-between py-1 text-base">
            <span className="font-bold text-gray-900">Totaal excl. BTW:</span>
            <span className="font-bold">€{(invoice.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 text-base">
            <span className="font-bold text-gray-900">Totaal BTW:</span>
            <span className="font-bold">€{(invoice.total_vat_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-300">
            <span className="font-bold text-xl text-gray-900">EINDTOTAAL:</span>
            <span className="font-bold text-xl text-smans-primary">
              €{((invoice.total_amount || 0) + (invoice.total_vat_amount || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer with payment info */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Betalingsgegevens:</h4>
            <p>IBAN: NL12 RABO 0123 4567 89</p>
            <p>BIC: RABONL2U</p>
            <p>T.n.v. {settings.company_name || 'SMANS BV'}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Contact:</h4>
            <p>Tel: 020-1234567</p>
            <p>Email: info@smans.nl</p>
            <p>Web: www.smans.nl</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <p>Gelieve bij betaling het factuurnummer te vermelden. Bij te late betaling worden rente en incassokosten in rekening gebracht.</p>
          <p className="mt-1">Vervaldatum: {new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
        </div>
      </div>
      </div>
    </div>
  );
};