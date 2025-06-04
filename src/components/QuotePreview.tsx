
interface QuotePreviewProps {
  formData: {
    customer: string;
    quoteNumber: string;
    date: string;
    validUntil: string;
    project?: string;
    message?: string;
    items: Array<{ id: string; description: string; quantity: number; price: number; vatRate: number; total: number }>;
  };
  customers: Array<{ id: number; name: string }>;
  projects?: Array<{ id: number; title: string; value: string; customer: string }>;
}

export function QuotePreview({ formData, customers, projects }: QuotePreviewProps) {
  const customerName = customers.find(c => c.id.toString() === formData.customer)?.name || "";
  const projectTitle = projects?.find(p => p.id.toString() === formData.project)?.title || "";
  
  const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const vatAmount = formData.items.reduce((sum, item) => {
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
            <p className="font-medium">SMANS BV</p>
            <p>Bedrijfsstraat 123</p>
            <p>1234 AB Amsterdam</p>
            <p>Nederland</p>
            <p className="mt-2">BTW: NL123456789B01</p>
            <p>KvK: 12345678</p>
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
            {formData.items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-800">
                  {item.description || `Offertelijn ${index + 1}`}
                </td>
                <td className="py-3 text-center text-gray-800">{item.quantity}</td>
                <td className="py-3 text-right text-gray-800">€{item.price.toFixed(2)}</td>
                <td className="py-3 text-center text-gray-800">{item.vatRate}%</td>
                <td className="py-3 text-right text-gray-800 font-medium">€{(item.total || 0).toFixed(2)}</td>
              </tr>
            ))}
            {formData.items.length === 0 && (
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

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Deze offerte is geldig tot {formData.validUntil || "[datum]"}.</strong></p>
          <p>Door akkoord te gaan met deze offerte gaat u een overeenkomst aan met SMANS BV onder de hieronder vermelde voorwaarden.</p>
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
