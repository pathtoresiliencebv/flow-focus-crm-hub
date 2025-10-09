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
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // ✅ Show loader while CRM data is loading
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

  useEffect(() => {
    fetchCustomers();
    fetchProjects();
  }, []);

  // Load existing invoice if editing
  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Customer Selection */}
        <div className="space-y-2">
          <Label htmlFor="customer_id">Klant *</Label>
          <Select
            value={selectedCustomerId}
            onValueChange={(value) => {
              setSelectedCustomerId(value);
              setValue('customer_id', value);
              setValue('project_id', ''); // Reset project when customer changes
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecteer een klant" />
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
            <p className="text-sm text-red-500">Klant is verplicht</p>
          )}
        </div>

        {/* Project Selection (Optional) */}
        {selectedCustomerId && customerProjects.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="project_id">Project (optioneel)</Label>
            <Select
              value={watch('project_id')}
              onValueChange={(value) => setValue('project_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Geen project</SelectItem>
                {customerProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-2" />
          Annuleren
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)]"
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
    </form>
  );
};

