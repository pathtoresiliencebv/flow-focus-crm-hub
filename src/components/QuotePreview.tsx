
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface QuotePreviewProps {
  formData: {
    customer?: string;
    quoteNumber?: string;
    date?: string;
    validUntil?: string;
    project?: string;
    message?: string;
    items?: Array<{ id?: string; description?: string; quantity?: number; price?: number; vatRate?: number; total?: number }>;
    adminSignature?: string;
  };
  customers: Array<{ id: number; name: string }>;
  projects?: Array<{ id: number; title: string; value: string; customer: string }>;
}

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

export function QuotePreview({ formData, customers, projects }: QuotePreviewProps) {
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

  const customerName = customers.find(c => c.id.toString() === formData.customer)?.name || "";
  const projectTitle = projects?.find(p => p.id.toString() === formData.project)?.title || "";
  
  const items = formData.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const vatAmount = items.reduce((sum, item) => {
    const itemTotal = item.total || 0;
    const vatRate = item.vatRate || 0;
    return sum + (itemTotal * vatRate / 100);
  }, 0);
  const total = subtotal + vatAmount;

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
          <p className="text-lg font-medium text-smans-primary">{formData.quoteNumber || "OFF-XXXX-XXXX"}</p>
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
            <p className="font-medium">{customerName || "Selecteer klant..."}</p>
            {projectTitle && (
              <p className="mt-2 text-smans-primary">Project: {projectTitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quote details */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div>
          <h4 className="font-medium text-gray-700">Offertedatum</h4>
          <p className="text-sm text-gray-600">{formData.date || "Selecteer datum..."}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Geldig tot</h4>
          <p className="text-sm text-gray-600">{formData.validUntil || "Selecteer datum..."}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Status</h4>
          <p className="text-sm text-gray-600">Concept</p>
        </div>
      </div>

      {/* Message */}
      {formData.message && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Bericht:</h4>
          <p className="text-sm text-gray-600">{formData.message}</p>
        </div>
      )}

      {/* Quote items table */}
      <div className="mb-8">
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
            {items.map((item, index) => (
              <tr key={item.id || index} className="border-b border-gray-100">
                <td className="py-3 text-gray-800">
                  {item.description || `Offertelijn ${index + 1}`}
                </td>
                <td className="py-3 text-center text-gray-800">{item.quantity || 0}</td>
                <td className="py-3 text-right text-gray-800">€{(item.price || 0).toFixed(2)}</td>
                <td className="py-3 text-center text-gray-800">{item.vatRate || 0}%</td>
                <td className="py-3 text-right text-gray-800 font-medium">€{(item.total || 0).toFixed(2)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr className="border-b border-gray-100">
                <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                  Voeg offerteregels toe...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotaal:</span>
            <span className="font-medium">€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">BTW:</span>
            <span className="font-medium">€{vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-200">
            <span className="font-bold text-lg">Totaal:</span>
            <span className="font-bold text-lg text-smans-primary">€{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Admin Signature Preview */}
      {formData.adminSignature && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">{settings.company_name || 'SMANS BV'}</h4>
          <div className="border rounded-lg p-4 bg-gray-50 inline-block">
            <img 
              src={formData.adminSignature} 
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
          <p><strong>Deze offerte is geldig tot {formData.validUntil || "[datum]"}.</strong></p>
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
}
