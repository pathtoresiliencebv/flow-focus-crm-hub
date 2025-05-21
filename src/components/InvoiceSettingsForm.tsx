
import React from 'react';
import { useForm } from "react-hook-form";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Define the form schema
const formSchema = z.object({
  invoicePrefix: z.string().min(1, {
    message: "Factuur-prefix is verplicht.",
  }),
  bankName: z.string().min(2, {
    message: "Banknaam is verplicht.",
  }),
  bankAccount: z.string().min(5, {
    message: "Bankrekeningnummer is verplicht.",
  }),
  vatNumber: z.string().min(5, {
    message: "BTW-nummer is verplicht.",
  }),
  kvkNumber: z.string().min(5, {
    message: "KVK-nummer is verplicht.",
  }),
  invoiceNotes: z.string().optional(),
  paymentTerms: z.string().min(1, {
    message: "Betalingstermijn is verplicht.",
  }),
});

export const InvoiceSettingsForm = () => {
  const { toast } = useToast();
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoicePrefix: "KOZ-",
      bankName: "ING Bank",
      bankAccount: "NL12 INGB 0123 4567 89",
      vatNumber: "NL123456789B01",
      kvkNumber: "12345678",
      invoiceNotes: "Betaling binnen 14 dagen na factuurdatum. Bij niet tijdige betaling zijn wij genoodzaakt administratiekosten in rekening te brengen.",
      paymentTerms: "14",
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, we would send this to the backend
    console.log("Invoice settings:", values);
    
    toast({
      title: "Factuurgegevens opgeslagen",
      description: "Uw factuurgegevens zijn succesvol bijgewerkt.",
    });
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-6">Factuurgegevens</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="invoicePrefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factuurprefix</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Bijv. "KOZ-" voor factuurnummer KOZ-001
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betalingstermijn (dagen)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bankAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bankrekeningnummer (IBAN)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BTW-nummer</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="kvkNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KVK-nummer</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="invoiceNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Factuurnotities</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field}
                    placeholder="Standaard tekst die onderaan elke factuur verschijnt"
                    className="min-h-[100px]" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end pt-4">
            <Button type="submit">Instellingen opslaan</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
