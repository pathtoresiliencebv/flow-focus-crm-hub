import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCrmStore } from '@/hooks/useCrmStore';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, X } from 'lucide-react';

interface SimpleInvoiceFormData {
  customer_id: string;
  project_id?: string;
  invoice_date: string;
  due_date: string;
  description: string;
  total_amount: number;
  vat_rate: number;
}

interface SimpleInvoiceFormProps {
  onClose: () => void;
  invoiceId?: string;
}

export const SimpleInvoiceForm: React.FC<SimpleInvoiceFormProps> = ({
  onClose,
  invoiceId
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { customers, projects, isLoading: crmLoading } = useCrmStore();
  
  // ✅ ALL HOOKS FIRST - Before any early returns (React Rules of Hooks)
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SimpleInvoiceFormData>({
    defaultValues: {
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vat_rate: 21,
      total_amount: 0,
      description: ''
    }
  });

  const totalAmount = watch('total_amount');
  const vatRate = watch('vat_rate');
  
  // Calculate amounts
  const subtotal = totalAmount / (1 + vatRate / 100);
  const vatAmount = totalAmount - subtotal;

  // ✅ useEffect - must be before early return but can reference functions declared later
  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  // ✅ Loading check AFTER all hooks (including useEffect)
  if (crmLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Klantgegevens laden...</p>
        </div>
      </div>
    );
  }

  const loadInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      if (data) {
        setValue('customer_id', data.customer_id || '');
        setValue('project_id', data.project_id || '');
        setValue('invoice_date', data.invoice_date);
        setValue('due_date', data.due_date);
        setValue('description', data.simple_description || '');
        setValue('total_amount', data.total_amount);
        setValue('vat_rate', data.vat_rate || 21);
        setSelectedCustomerId(data.customer_id || '');
      }
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      toast({
        title: 'Fout bij laden',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const onSubmit = async (data: SimpleInvoiceFormData) => {
    setIsSaving(true);

    try {
      // Get customer details
      const customer = customers.find(c => c.id === data.customer_id);
      if (!customer) {
        throw new Error('Klant niet gevonden');
      }

      // Get project details if selected
      const project = data.project_id 
        ? projects.find(p => p.id === data.project_id) 
        : null;

      // Generate invoice number if creating new
      let invoiceNumber = '';
      if (!invoiceId) {
        const { data: numberData, error: numberError } = await supabase
          .rpc('generate_invoice_number');
        
        if (numberError) {
          throw new Error(`Kon factuurnummer niet genereren: ${numberError.message}`);
        }
        
        invoiceNumber = numberData;
      }

      // Calculate final amounts
      const finalSubtotal = data.total_amount / (1 + data.vat_rate / 100);
      const finalVatAmount = data.total_amount - finalSubtotal;

      // Prepare invoice data
      const invoiceData = {
        invoice_type: 'simple',
        invoice_number: invoiceId ? undefined : invoiceNumber,
        customer_id: data.customer_id,
        customer_name: customer.name,
        customer_email: customer.email || '',
        project_id: data.project_id || null,
        project_title: project?.title || '',
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        simple_description: data.description,
        subtotal: finalSubtotal,
        vat_amount: finalVatAmount,
        vat_rate: data.vat_rate,
        total_amount: data.total_amount,
        status: 'concept',
        updated_at: new Date().toISOString()
      };

      if (invoiceId) {
        // Update existing invoice
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoiceId);

        if (error) throw error;

        toast({
          title: 'Factuur bijgewerkt',
          description: 'De factuur is succesvol bijgewerkt.'
        });
      } else {
        // Create new invoice
        const { data: newInvoice, error } = await supabase
          .from('invoices')
          .insert({
            ...invoiceData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Factuur aangemaakt',
          description: `Factuur ${invoiceNumber} is succesvol aangemaakt.`
        });
      }

      // ✅ FIX: Only close dialog, no navigation to prevent auth loop
      onClose();
      
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Fout bij opslaan',
        description: error.message || 'Kon factuur niet opslaan',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get projects for selected customer
  const customerProjects = projects.filter(
    p => p.customer_id === selectedCustomerId
  );

  // Preview invoice object
  const customer = customers.find(c => c.id === selectedCustomerId);
  const project = watch('project_id') ? projects.find(p => p.id === watch('project_id')) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
      {/* Left side - Form */}
      <div className="lg:col-span-2 space-y-4 pr-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Nieuwe factuur</h3>
          <div className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-800">
            Concept
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Customer & Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_id">Klant *</Label>
              <Select
                value={selectedCustomerId}
                onValueChange={(value) => {
                  setSelectedCustomerId(value);
                  setValue('customer_id', value);
                  setValue('project_id', '');
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecteer klant" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && (
                <p className="text-sm text-red-500 mt-1">Klant is verplicht</p>
              )}
            </div>

            <div>
              <Label htmlFor="project_id">Project</Label>
              <Select
                value={watch('project_id') || ''}
                onValueChange={(value) => setValue('project_id', value === 'none' ? null : value)}
                disabled={!selectedCustomerId || customerProjects.length === 0}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecteer project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen project</SelectItem>
                  {customerProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoice_date">Factuurdatum *</Label>
            <Input
              type="date"
              {...register('invoice_date', { required: true })}
            />
            {errors.invoice_date && (
              <p className="text-sm text-red-500">Factuurdatum is verplicht</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Vervaldatum *</Label>
            <Input
              type="date"
              {...register('due_date', { required: true })}
            />
            {errors.due_date && (
              <p className="text-sm text-red-500">Vervaldatum is verplicht</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Omschrijving *</Label>
          <Textarea
            {...register('description', { required: true })}
            placeholder="Beschrijving van de dienst of het product..."
            rows={4}
          />
          {errors.description && (
            <p className="text-sm text-red-500">Omschrijving is verplicht</p>
          )}
        </div>

        {/* Amount and VAT */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total_amount">Totaalbedrag (incl. BTW) *</Label>
            <Input
              type="number"
              step="0.01"
              {...register('total_amount', { 
                required: true,
                min: 0.01,
                valueAsNumber: true 
              })}
              placeholder="0.00"
            />
            {errors.total_amount && (
              <p className="text-sm text-red-500">Totaalbedrag is verplicht</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat_rate">BTW-tarief *</Label>
            <Select
              value={vatRate.toString()}
              onValueChange={(value) => setValue('vat_rate', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0% (Vrijgesteld)</SelectItem>
                <SelectItem value="9">9% (Verlaagd)</SelectItem>
                <SelectItem value="21">21% (Hoog)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amount Breakdown */}
        {totalAmount > 0 && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Bedragen overzicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotaal (excl. BTW):</span>
                <span className="font-semibold">€ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>BTW ({vatRate}%):</span>
                <span className="font-semibold">€ {vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold">Totaal (incl. BTW):</span>
                <span className="font-bold text-lg">€ {totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {invoiceId ? 'Bijwerken' : 'Aanmaken'}
                </>
              )}
            </Button>
          </div>

          {/* Herinneringsschema onderaan */}
          {watch('due_date') && (
            <div className="mt-8 p-6 bg-white border-2 border-amber-400 rounded-xl shadow-lg">
              <h4 className="font-bold text-xl text-amber-900 mb-5 flex items-center gap-3">
                <span className="text-3xl">⏰</span>
                Automatische Betalingsherinneringen
              </h4>
              <div className="space-y-4">
                {[1, 2, 3].map((num) => {
                  const due = new Date(watch('due_date'));
                  const reminderDate = new Date(due);
                  reminderDate.setDate(due.getDate() + (num * 14));
                  
                  return (
                    <div key={num} className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:border-amber-400 transition-all">
                      <span className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                        {num}
                      </span>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-800 text-base block">
                          {num === 1 ? '1e' : num === 2 ? '2e' : '3e'} herinnering
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-amber-900 text-lg">
                            {reminderDate.toLocaleDateString('nl-NL', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span className="text-sm text-gray-600">
                            ({14 * num} dagen na vervaldatum)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-amber-800 mt-5 italic flex items-center gap-2 bg-amber-100 p-3 rounded-lg">
                <span className="text-lg">💡</span>
                <span className="font-medium">Herinneringen worden automatisch verstuurd als de factuur niet is betaald</span>
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Right side - Preview */}
      <div className="lg:col-span-3 h-[calc(100vh-120px)] sticky top-4">
        <div className="h-full bg-white rounded-lg border p-6 overflow-auto">
          <h4 className="text-sm font-medium text-gray-600 mb-4">Preview</h4>
          {customer ? (
            <div className="space-y-6">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">SMANS BV</h2>
                <p className="text-sm text-gray-600 mt-1">Factuur</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-700">Van:</p>
                  <p className="mt-1">SMANS BV</p>
                  <p>Pauwstraat 8, Breda</p>
                  <p>4815GL Breda</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Aan:</p>
                  <p className="mt-1">{customer.name}</p>
                  {customer.address && <p>{customer.address}</p>}
                  {customer.email && <p>{customer.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Factuurdatum:</p>
                  <p className="font-medium">{watch('invoice_date') ? new Date(watch('invoice_date')).toLocaleDateString('nl-NL') : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Vervaldatum:</p>
                  <p className="font-medium">{watch('due_date') ? new Date(watch('due_date')).toLocaleDateString('nl-NL') : '-'}</p>
                </div>
              </div>

              {project && (
                <div className="text-sm">
                  <p className="text-gray-600">Project:</p>
                  <p className="font-medium">{project.title}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Omschrijving</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{watch('description') || 'Geen omschrijving'}</p>
              </div>

              {totalAmount > 0 && (
                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotaal:</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BTW ({vatRate}%):</span>
                    <span>€{vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold text-lg">
                    <span>Totaal:</span>
                    <span className="text-primary">€{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-400 mt-8">Selecteer een klant om preview te zien</p>
          )}
        </div>
      </div>
    </div>
  );
};

