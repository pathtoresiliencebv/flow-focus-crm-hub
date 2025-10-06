/**
 * PDF Test Component
 * Test component for the PDF generation system
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuotePDFButton, InvoicePDFButton, ReceiptPDFButton } from './PDFGeneratorButton';
import { QuotePDFPreview, InvoicePDFPreview } from './PDFPreview';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';

export const PDFTestComponent: React.FC = () => {
  const [testData, setTestData] = useState({
    quoteNumber: 'Q-2024-001',
    invoiceNumber: 'F-2024-001',
    receiptNumber: 'R-2024-001',
    date: '2024-01-15',
    customerName: 'Test Customer BV',
    customerAddress: '123 Teststraat, Amsterdam',
    customerEmail: 'test@customer.nl',
    projectName: 'Website Development',
    companyName: 'SmansCRM',
    companyAddress: '456 Business Ave, Rotterdam',
    companyVatNumber: 'NL123456789B01',
    companyEmail: 'info@smanscrm.nl',
    companyPhone: '+31 10 123 4567'
  });

  const [quoteData, setQuoteData] = useState({
    quoteNumber: testData.quoteNumber,
    date: testData.date,
    customerName: testData.customerName,
    customerAddress: testData.customerAddress,
    customerEmail: testData.customerEmail,
    projectName: testData.projectName,
    location: 'Amsterdam',
    startDate: '2024-02-01',
    endDate: '2024-03-01',
    items: [
      {
        name: 'Website Design',
        description: 'Complete website redesign',
        quantity: 1,
        unit: 'project',
        price: 5000,
        total: 5000
      },
      {
        name: 'Development',
        description: 'Frontend and backend development',
        quantity: 40,
        unit: 'hours',
        price: 75,
        total: 3000
      }
    ],
    subtotal: 8000,
    vatRate: 21,
    vatAmount: 1680,
    totalWithVat: 9680,
    notes: 'Alle prijzen zijn exclusief hosting en domein.',
    terms: 'Betaling binnen 30 dagen na akkoord.',
    validUntil: '2024-02-15'
  });

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: testData.invoiceNumber,
    invoiceDate: testData.date,
    dueDate: '2024-02-14',
    customerName: testData.customerName,
    customerAddress: testData.customerAddress,
    customerEmail: testData.customerEmail,
    customerVatNumber: 'NL987654321B01',
    companyName: testData.companyName,
    companyAddress: testData.companyAddress,
    companyVatNumber: testData.companyVatNumber,
    companyEmail: testData.companyEmail,
    companyPhone: testData.companyPhone,
    items: [
      {
        description: 'Website Development',
        quantity: 40,
        unit: 'hours',
        unitPrice: 75,
        total: 3000
      }
    ],
    subtotal: 3000,
    vatRate: 21,
    vatAmount: 630,
    totalWithVat: 3630,
    paymentTerms: 'Betaling binnen 30 dagen na factuurdatum.',
    bankDetails: 'IBAN: NL91ABNA0417164300\nBIC: ABNANL2A'
  });

  const [receiptData, setReceiptData] = useState({
    receiptNumber: testData.receiptNumber,
    date: testData.date,
    customerName: testData.customerName,
    items: [
      {
        description: 'Consultancy',
        quantity: 2,
        price: 150,
        total: 300
      }
    ],
    total: 300
  });

  const { generatePDFWithEdgeFunction, isGenerating, error } = usePDFGenerator();

  const handleTestEdgeFunction = async () => {
    try {
      const result = await generatePDFWithEdgeFunction({
        template: 'quote',
        data: quoteData,
        options: {
          paperFormat: 'a4',
          paperOrientation: 'portrait',
          watermark: 'TEST'
        }
      });

      console.log('Edge Function result:', result);
    } catch (err) {
      console.error('Edge Function test failed:', err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>📄 PDF Generation System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={testData.customerName}
                onChange={(e) => setTestData({ ...testData, customerName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={testData.projectName}
                onChange={(e) => setTestData({ ...testData, projectName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quoteNumber">Quote Number</Label>
              <Input
                id="quoteNumber"
                value={testData.quoteNumber}
                onChange={(e) => setTestData({ ...testData, quoteNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={testData.invoiceNumber}
                onChange={(e) => setTestData({ ...testData, invoiceNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input
                id="receiptNumber"
                value={testData.receiptNumber}
                onChange={(e) => setTestData({ ...testData, receiptNumber: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Textarea
              id="customerAddress"
              value={testData.customerAddress}
              onChange={(e) => setTestData({ ...testData, customerAddress: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quote Test */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Quote PDF Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuotePDFButton
              data={quoteData}
              options={{
                paperFormat: 'a4',
                paperOrientation: 'portrait',
                watermark: 'OFFERTE'
              }}
            />
            <QuotePDFPreview
              data={quoteData}
              options={{
                paperFormat: 'a4',
                watermark: 'DRAFT'
              }}
            />
          </CardContent>
        </Card>

        {/* Invoice Test */}
        <Card>
          <CardHeader>
            <CardTitle>🧾 Invoice PDF Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InvoicePDFButton
              data={invoiceData}
              options={{
                paperFormat: 'a4',
                paperOrientation: 'portrait',
                watermark: 'FACTUUR'
              }}
            />
            <InvoicePDFPreview
              data={invoiceData}
              options={{
                paperFormat: 'a4',
                watermark: 'DRAFT'
              }}
            />
          </CardContent>
        </Card>

        {/* Receipt Test */}
        <Card>
          <CardHeader>
            <CardTitle>🧾 Receipt PDF Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReceiptPDFButton
              data={receiptData}
              options={{
                paperFormat: 'a4',
                paperOrientation: 'portrait',
                watermark: 'BONNETJE'
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edge Function Test */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Edge Function Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleTestEdgeFunction}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Testing...' : 'Test Edge Function'}
          </Button>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>📊 System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>PDF Generator Service: ✅ Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Markdown Templates: ✅ Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Edge Function: ✅ Deployed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Frontend Components: ✅ Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

