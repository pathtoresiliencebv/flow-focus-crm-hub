import { Receipt } from "lucide-react";

interface InvoicePreviewProps {
  formData: {
    customer: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    project?: string;
    items: Array<{ id: string; description: string; quantity: number; price: number; total: number }>;
  };
  customers: Array<{ id: number; name: string }>;
  projects?: Array<{ id: number; title: string; value: string; customer: string }>;
}

export function InvoicePreview({ formData, customers, projects }: InvoicePreviewProps) {
  const customerName = customers.find(c => c.id.toString() === formData.customer)?.name || "";
  const projectTitle = projects?.find(p => p.id.toString() === formData.project)?.title || "";
  
  const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  const vat = subtotal * 0.21;
  const total = subtotal + vat;

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">FACTUUR</h2>
          <p className="text-lg font-medium text-smans-primary">{formData.invoiceNumber || "INV-XXXX-XXXX"}</p>
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

      {/* Invoice details */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div>
          <h4 className="font-medium text-gray-700">Factuurdatum</h4>
          <p className="text-sm text-gray-600">{formData.date || "Selecteer datum..."}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Vervaldatum</h4>
          <p className="text-sm text-gray-600">{formData.dueDate || "Selecteer datum..."}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Betalingstermijn</h4>
          <p className="text-sm text-gray-600">14 dagen</p>
        </div>
      </div>

      {/* Invoice items table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 font-semibold text-gray-900">Omschrijving</th>
              <th className="text-center py-3 font-semibold text-gray-900 w-20">Aantal</th>
              <th className="text-right py-3 font-semibold text-gray-900 w-24">Prijs</th>
              <th className="text-right py-3 font-semibold text-gray-900 w-24">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 text-gray-800">
                  {item.description || `Factuurlijn ${index + 1}`}
                </td>
                <td className="py-3 text-center text-gray-800">{item.quantity}</td>
                <td className="py-3 text-right text-gray-800">€{item.price.toFixed(2)}</td>
                <td className="py-3 text-right text-gray-800 font-medium">€{(item.total || 0).toFixed(2)}</td>
              </tr>
            ))}
            {formData.items.length === 0 && (
              <tr className="border-b border-gray-100">
                <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                  Voeg factuurregels toe...
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
            <span className="text-gray-600">BTW (21%):</span>
            <span className="font-medium">€{vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-gray-200">
            <span className="font-bold text-lg">Totaal:</span>
            <span className="font-bold text-lg text-smans-primary">€{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Betalingsgegevens:</h4>
            <p>IBAN: NL12 RABO 0123 4567 89</p>
            <p>BIC: RABONL2U</p>
            <p>T.n.v. SMANS BV</p>
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
        </div>
      </div>
    </div>
  );
}
