
import React, { useState, useEffect } from 'react';
import { Quote } from '@/types/quote';
import { supabase } from "@/integrations/supabase/client";

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
}

export const MultiBlockQuotePreview: React.FC<MultiBlockQuotePreviewProps> = ({ quote }) => {
  const [settings, setSettings] = useState<QuoteSettings>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    console.log('MultiBlockQuotePreview: Quote prop updated:', quote);
    console.log('MultiBlockQuotePreview: Number of blocks:', quote.blocks?.length || 0);
    if (quote.blocks) {
      quote.blocks.forEach((block, index) => {
        console.log(`Block ${index + 1}: "${block.title}" with ${block.items?.length || 0} items`);
      });
    }
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

  console.log('MultiBlockQuotePreview: Rendering with quote:', quote);

  return (
    <div className="bg-white border rounded-lg p-8 shadow-sm max-h-[80vh] overflow-y-auto">
      {/* Header with logo and company info */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
            alt="SMANS Logo" 
            className="h-12 w-auto object-contain"
          />
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">OFFERTE</h2>
          <p className="text-lg font-medium text-smans-primary">{quote.quote_number}</p>
        </div>
      </div>

      {/* Company and customer info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
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
      <div className="grid grid-cols-3 gap-4 mb-8">
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
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Bericht:</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">{quote.message}</p>
        </div>
      )}

      {/* Quote blocks - ENHANCED VISIBILITY */}
      <div className="space-y-8 mb-8">
        {quote.blocks && quote.blocks.length > 0 ? (
          <>
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">OFFERTEONDERDELEN</h3>
              <div className="w-full h-1 bg-gradient-to-r from-smans-primary to-transparent rounded"></div>
            </div>
            {quote.blocks.map((block, blockIndex) => {
              console.log('MultiBlockQuotePreview: Rendering block:', block);
              return (
                <div key={`${block.id}-${blockIndex}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
                  {/* Block Title - conditional for type */}
                  <div className="mb-4 pb-2 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {block.title}
                    </h3>
                    {block.type === 'product' && (
                      <div className="text-sm text-gray-500">
                        Onderdeel {blockIndex + 1} van {quote.blocks.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Render based on block type */}
                  {block.type === 'textblock' ? (
                    /* Text Block Content */
                    <div className="mb-4">
                      <div className="text-gray-700 whitespace-pre-line text-sm p-4 bg-gray-50 rounded-lg leading-relaxed">
                        {block.content || 'Geen tekst ingevoerd'}
                      </div>
                    </div>
                  ) : (
                    /* Product Block Content */
                    <>
                      {block.items && block.items.length > 0 ? (
                         <div className="mb-4">
                           {/* Table with mixed content */}
                           <div className="bg-gray-50 rounded border">
                             {/* Table header (only show if there are products) */}
                             {block.items.some(item => item.type === 'product') && (
                               <div className="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-100 border-b font-medium text-gray-700 text-xs">
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
                                 <div key={`product-${item.id || itemIndex}`} className="grid grid-cols-12 gap-4 py-2 px-4 border-b border-gray-100 text-xs">
                                   <div className="col-span-6 text-gray-800">{item.description || 'Geen beschrijving'}</div>
                                   <div className="col-span-2 text-center text-gray-800">{item.quantity || 0}</div>
                                   <div className="col-span-2 text-right text-gray-800">€{(item.unit_price || 0).toFixed(2)}</div>
                                   <div className="col-span-1 text-center text-gray-800">{item.vat_rate || 0}%</div>
                                   <div className="col-span-1 text-right text-gray-800 font-medium">€{(item.total || 0).toFixed(2)}</div>
                                 </div>
                               ) : (
                                 <div key={`text-${item.id || itemIndex}`} className="col-span-12 px-4 py-3 border-b border-gray-100">
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
                    </>
                  )}

                   {/* Block totals (only if block has products) */}
                   {block.items && block.items.some(item => item.type === 'product') && (
                     <div className="flex justify-end mt-3">
                       <div className="w-64 bg-gray-50 rounded border p-3">
                         <div className="space-y-2 text-sm">
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
            })}
          </>
        ) : (
          <div className="text-gray-400 italic text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-xl font-medium mb-3">Geen blokken toegevoegd aan deze offerte</div>
            <div className="text-base">Voeg eerst blokken toe om ze hier te zien</div>
          </div>
        )}
      </div>

      {/* Grand totals */}
      <div className="flex justify-end border-t-2 border-gray-200 pt-6 bg-gray-50 rounded-lg p-6 mt-8">
        <div className="w-80 space-y-3">
          <div className="flex justify-between py-2 text-lg">
            <span className="font-bold text-gray-900">Totaal excl. BTW:</span>
            <span className="font-bold">€{(quote.total_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 text-lg">
            <span className="font-bold text-gray-900">Totaal BTW:</span>
            <span className="font-bold">€{(quote.total_vat_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-300">
            <span className="font-bold text-2xl text-gray-900">EINDTOTAAL:</span>
            <span className="font-bold text-2xl text-smans-primary">
              €{((quote.total_amount || 0) + (quote.total_vat_amount || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Signature Preview */}
      {quote.admin_signature_data && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">{settings.company_name || 'SMANS BV'}</h4>
          <div className="border rounded-lg p-4 bg-gray-50 inline-block">
            <img 
              src={quote.admin_signature_data} 
              alt="SMANS Handtekening" 
              className="max-w-xs h-24 object-contain"
            />
            <p className="text-sm text-gray-600 mt-2">Namens {settings.company_name || 'SMANS BV'}</p>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      {settings.terms_and_conditions && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Algemene Voorwaarden</h4>
          <div className="text-sm text-gray-600 whitespace-pre-line">
            {settings.terms_and_conditions}
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
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Akkoord verklaring:</h4>
          <p className="text-sm text-gray-600">
            Door digitaal te ondertekenen gaat u akkoord met de voorwaarden en prijzen zoals vermeld in deze offerte.
          </p>
        </div>
      </div>
    </div>
  );
};
