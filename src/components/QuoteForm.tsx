import React, { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuotePreview } from './QuotePreview';
import { SignatureCanvas } from './SignatureCanvas';
import { supabase } from "@/integrations/supabase/client";

// Form schema
const formSchema = z.object({
  customer: z.string().min(1, { message: "Selecteer een klant" }),
  quoteNumber: z.string().min(1, { message: "Offertenummer is verplicht" }),
  date: z.string().min(1, { message: "Datum is verplicht" }),
  validUntil: z.string().min(1, { message: "Geldig tot datum is verplicht" }),
  project: z.string().optional(),
  message: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, { message: "Omschrijving is verplicht" }),
    quantity: z.number().min(1, { message: "Aantal moet minimaal 1 zijn" }),
    price: z.number().min(0, { message: "Prijs moet positief zijn" }),
    vatRate: z.number().min(0).max(100),
    total: z.number()
  }))
});

interface QuoteFormProps {
  onClose: () => void;
  customers: Array<{ id: number; name: string; email?: string }>;
  projects?: Array<{ id: number; title: string; value: string; customer: string }>;
}

export function QuoteForm({ onClose, customers, projects }: QuoteFormProps) {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [adminSignature, setAdminSignature] = useState('');
  const [saving, setSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      quoteNumber: `OFF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      project: "",
      message: "",
      items: [{
        id: "1",
        description: "",
        quantity: 1,
        price: 0,
        vatRate: 21,
        total: 0
      }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchedFields = form.watch();

  // Update totals when quantity, price or VAT rate changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.includes('items') && (name.includes('quantity') || name.includes('price') || name.includes('vatRate'))) {
        const items = value.items || [];
        items.forEach((item, index) => {
          if (item) {
            const quantity = item.quantity || 0;
            const price = item.price || 0;
            const total = quantity * price;
            form.setValue(`items.${index}.total`, total);
          }
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const addItem = () => {
    append({
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      price: 0,
      vatRate: 21,
      total: 0
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSaving(true);
    try {
      // Calculate totals
      const items = values.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      const vatAmount = items.reduce((sum, item) => {
        const itemTotal = item.total || 0;
        const vatRate = item.vatRate || 0;
        return sum + (itemTotal * vatRate / 100);
      }, 0);
      const total = subtotal + vatAmount;

      // Find customer details
      const customer = customers.find(c => c.id.toString() === values.customer);
      const project = projects?.find(p => p.id.toString() === values.project);

      // Generate public token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_quote_public_token');

      if (tokenError) {
        console.error('Error generating token:', tokenError);
        toast({
          title: "Fout",
          description: "Kon geen publieke link genereren.",
          variant: "destructive",
        });
        return;
      }

      // Save quote to database
      const { data, error } = await supabase
        .from('quotes')
        .insert({
          quote_number: values.quoteNumber,
          customer_name: customer?.name || '',
          customer_email: customer?.email || '',
          project_title: project?.title || '',
          quote_date: values.date,
          valid_until: values.validUntil,
          message: values.message || '',
          items: values.items,
          subtotal: subtotal,
          vat_amount: vatAmount,
          total_amount: total,
          status: 'concept',
          public_token: tokenData,
          admin_signature_data: adminSignature || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving quote:', error);
        toast({
          title: "Fout bij opslaan",
          description: "De offerte kon niet worden opgeslagen.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Offerte opgeslagen",
        description: `Offerte ${values.quoteNumber} is succesvol opgeslagen.`,
      });

      console.log("Quote saved with public link:", `${window.location.origin}/quote/${tokenData}`);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const filteredProjects = projects?.filter(project => 
    project.customer === customers.find(c => c.id.toString() === watchedFields.customer)?.name
  ) || [];

  if (previewMode) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[80vh] overflow-hidden">
        <div className="space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Offerte gegevens</h3>
            <Button onClick={() => setPreviewMode(false)} variant="outline">
              Terug naar bewerken
            </Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">
                Formulier wordt hier getoond in compacte vorm...
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="overflow-y-auto">
          <QuotePreview 
            formData={{
              ...watchedFields,
              adminSignature
            }} 
            customers={customers}
            projects={projects}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[80vh] overflow-hidden">
      <div className="space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Offerte aanmaken</h3>
          <Button onClick={() => setPreviewMode(true)} variant="outline">
            Preview
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klant *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer klant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (optioneel)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quoteNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offertenummer *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geldig tot *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bericht (optioneel)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Voeg een persoonlijk bericht toe..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Offerteregels</span>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Regel toevoegen
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Omschrijving *</FormLabel>}
                            <FormControl>
                              <Input {...field} placeholder="Beschrijving" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Aantal</FormLabel>}
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Prijs (€)</FormLabel>}
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.vatRate`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>BTW%</FormLabel>}
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.total`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Totaal</FormLabel>}
                            <FormControl>
                              <Input {...field} disabled className="bg-gray-50" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1">
                      {index === 0 && <div className="text-sm font-medium mb-2">Actie</div>}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Admin Signature */}
            <SignatureCanvas
              title="Uw handtekening (SMANS BV)"
              onSignature={setAdminSignature}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Bezig met opslaan..." : "Offerte aanmaken"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="overflow-y-auto">
        <QuotePreview 
          formData={{
            ...watchedFields,
            adminSignature
          }} 
          customers={customers}
          projects={projects}
        />
      </div>
    </div>
  );
}
