
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QuoteBlockForm } from './QuoteBlockForm';
import { MultiBlockQuotePreview } from './MultiBlockQuotePreview';
import { SignatureCanvas } from '../SignatureCanvas';
import { QuoteBlock, Quote } from '@/types/quote';
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  customer: z.string().min(1, { message: "Selecteer een klant" }),
  quoteNumber: z.string().min(1, { message: "Offertenummer is verplicht" }),
  date: z.string().min(1, { message: "Datum is verplicht" }),
  validUntil: z.string().min(1, { message: "Geldig tot datum is verplicht" }),
  project: z.string().optional(),
  message: z.string().optional(),
});

interface MultiBlockQuoteFormProps {
  onClose: () => void;
  customers: Array<{ id: number; name: string; email?: string }>;
  projects?: Array<{ id: number; title: string; value: string; customer: string }>;
}

export const MultiBlockQuoteForm: React.FC<MultiBlockQuoteFormProps> = ({
  onClose,
  customers,
  projects
}) => {
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<QuoteBlock[]>([
    {
      id: crypto.randomUUID(),
      title: 'Hoofdwerkzaamheden',
      items: [],
      subtotal: 0,
      vat_amount: 0,
      order_index: 0
    }
  ]);
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
    },
  });

  const watchedFields = form.watch();

  const addBlock = () => {
    const newBlock: QuoteBlock = {
      id: crypto.randomUUID(),
      title: `Blok ${blocks.length + 1}`,
      items: [],
      subtotal: 0,
      vat_amount: 0,
      order_index: blocks.length
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updatedBlock: QuoteBlock) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[index] = updatedBlock;
    setBlocks(updatedBlocks);
  };

  const deleteBlock = (index: number) => {
    if (blocks.length > 1) {
      const updatedBlocks = blocks.filter((_, i) => i !== index);
      setBlocks(updatedBlocks);
    }
  };

  const calculateTotalAmount = (): number => {
    return blocks.reduce((sum, block) => sum + block.subtotal, 0);
  };

  const calculateTotalVAT = (): number => {
    return blocks.reduce((sum, block) => sum + block.vat_amount, 0);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSaving(true);
    try {
      const customer = customers.find(c => c.id.toString() === values.customer);
      const project = projects?.find(p => p.id.toString() === values.project);

      const totalAmount = calculateTotalAmount();
      const totalVAT = calculateTotalVAT();

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

      // Save quote to database with new block structure
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
          items: JSON.parse(JSON.stringify(blocks)), // Convert to JSON-compatible format
          subtotal: totalAmount,
          vat_amount: totalVAT,
          total_amount: totalAmount + totalVAT,
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
  };

  const filteredProjects = projects?.filter(project => 
    project.customer === customers.find(c => c.id.toString() === watchedFields.customer)?.name
  ) || [];

  const totalAmount = calculateTotalAmount();
  const totalVAT = calculateTotalVAT();
  const grandTotal = totalAmount + totalVAT;

  // Create preview quote object
  const previewQuote: Quote = {
    quote_number: watchedFields.quoteNumber || `OFF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    customer_name: customers.find(c => c.id.toString() === watchedFields.customer)?.name || '',
    customer_email: customers.find(c => c.id.toString() === watchedFields.customer)?.email || '',
    project_title: projects?.find(p => p.id.toString() === watchedFields.project)?.title || '',
    quote_date: watchedFields.date || new Date().toISOString().split('T')[0],
    valid_until: watchedFields.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    message: watchedFields.message || '',
    blocks,
    total_amount: totalAmount,
    total_vat_amount: totalVAT,
    status: 'concept',
    admin_signature_data: adminSignature
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[80vh] overflow-hidden">
      {/* Left side - Form */}
      <div className="space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Nieuwe offerte - Meerdere blokken</h3>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Form Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Offerte Gegevens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
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
              </CardContent>
            </Card>

            {/* Quote Blocks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Offerte Blokken</CardTitle>
                  <Button type="button" onClick={addBlock} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Blok toevoegen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {blocks.map((block, index) => (
                  <QuoteBlockForm
                    key={block.id}
                    block={block}
                    onUpdateBlock={(updatedBlock) => updateBlock(index, updatedBlock)}
                    onDeleteBlock={() => deleteBlock(index)}
                    canDelete={blocks.length > 1}
                  />
                ))}

                {/* Grand Total */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-lg">
                          <span className="font-medium">Totaal excl. BTW:</span>
                          <span className="font-medium">€{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="font-medium">Totaal BTW:</span>
                          <span className="font-medium">€{totalVAT.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-t-2 border-gray-300">
                          <span className="font-bold text-xl">Eindtotaal:</span>
                          <span className="font-bold text-xl text-smans-primary">
                            €{grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Bezig met opslaan..." : "Offerte opslaan"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Right side - Live Preview */}
      <div className="overflow-y-auto">
        <MultiBlockQuotePreview quote={previewQuote} />
      </div>
    </div>
  );
};
