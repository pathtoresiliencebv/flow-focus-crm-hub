
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Calendar, Settings } from "lucide-react";

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
  stripeIntegration: z.boolean().default(false),
  stripePublishableKey: z.string().optional(),
  googleCalendarIntegration: z.boolean().default(false),
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
      stripeIntegration: true,
      stripePublishableKey: "pk_test_51PiYZJRv5cVaeSzxGHsOUYYVgBQqC8Z331OCb5vOQMb7IL9MUaneQ2lZzAjy2ssbIcF7ugnJ8aOq0pwvNczsQL5N00AONIMOOZ",
      googleCalendarIntegration: false,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Algemene Factuurgegevens
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Betalingsintegratie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <FormField
              control={form.control}
              name="stripeIntegration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Stripe Betalingslinks inschakelen
                    </FormLabel>
                    <FormDescription>
                      Voeg automatisch een betaallink toe aan facturen
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("stripeIntegration") && (
              <FormField
                control={form.control}
                name="stripePublishableKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Publishable Key</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="pk_test_..." />
                    </FormControl>
                    <FormDescription>
                      Uw Stripe publishable key voor het verwerken van betalingen
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">✅ Stripe Configuratie Status</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Stripe Secret Key: Geconfigureerd in Supabase</li>
                <li>• Publishable Key: {form.watch("stripePublishableKey") ? "Ingesteld" : "Nog in te stellen"}</li>
                <li>• Payment Function: Beschikbaar</li>
              </ul>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integratie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <FormField
              control={form.control}
              name="googleCalendarIntegration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Google Calendar Synchronisatie
                    </FormLabel>
                    <FormDescription>
                      Synchroniseer afspraken met Google Calendar (nog niet actief)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={true}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">🔄 Google Calendar Voorbereiding</h4>
              <p className="text-sm text-blue-700 mb-2">
                Google Calendar integratie is voorbereid maar nog niet actief.
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• OAuth2 configuratie: Nog te implementeren</li>
                <li>• Calendar API toegang: Nog te configureren</li>
                <li>• Automatische sync: Voorbereid</li>
              </ul>
            </div>
          </Form>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={form.handleSubmit(onSubmit)}>
          Alle instellingen opslaan
        </Button>
      </div>
    </div>
  );
};
