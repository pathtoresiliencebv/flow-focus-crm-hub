
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

  return (
    <div className="bg-white border rounded-lg p-8 shadow-sm">
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
          <p className="text-sm text-gray-600">Concept</p>
        </div>
      </div>

      {/* Message */}
      {quote.message && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Bericht:</h4>
          <p className="text-sm text-gray-600">{quote.message}</p>
        </div>
      )}

      {/* Quote blocks */}
      <div className="space-y-8 mb-8">
        {quote.blocks.map((block, blockIndex) => (
          <div key={block.id} className="border-l-4 border-smans-primary pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{block.title}</h3>
            
            {/* Block items */}
            <div className="space-y-3 mb-4">
              {block.items.map((item, itemIndex) => (
                <div key={item.id}>
                  {item.type === 'product' ? (
                    <div className="grid grid-cols-12 gap-3 py-2 border-b border-gray-100">
                      <div className="col-span-6 text-gray-800">{item.description}</div>
                      <div className="col-span-2 text-center text-gray-800">{item.quantity}</div>
                      <div className="col-span-2 text-right text-gray-800">€{item.unit_price?.toFixed(2)}</div>
                      <div className="col-span-1 text-center text-gray-800">{item.vat_rate}%</div>
                      <div className="col-span-1 text-right text-gray-800 font-medium">€{item.total?.toFixed(2)}</div>
                    </div>
                  ) : (
                    <div className="py-2 px-3 bg-gray-50 rounded" style={getItemStyle(item)}>
                      <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Block totals (only if block has products) */}
            {block.items.some(item => item.type === 'product') && (
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotaal {block.title}:</span>
                    <span className="font-medium">€{block.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">BTW:</span>
                    <span className="font-medium">€{block.vat_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t">
                    <span className="font-semibold">Totaal {block.title}:</span>
                    <span className="font-semibold text-smans-primary">
                      €{(block.subtotal + block.vat_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grand totals */}
      <div className="flex justify-end border-t-2 border-gray-200 pt-4">
        <div className="w-64 space-y-2">
          <div className="flex justify-between py-1 text-lg">
            <span className="font-semibold text-gray-900">Totaal excl. BTW:</span>
            <span className="font-semibold">€{quote.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 text-lg">
            <span className="font-semibold text-gray-900">Totaal BTW:</span>
            <span className="font-semibold">€{quote.total_vat_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-200">
            <span className="font-bold text-xl">EINDTOTAAL:</span>
            <span className="font-bold text-xl text-smans-primary">
              €{(quote.total_amount + quote.total_vat_amount).toFixed(2)}
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
