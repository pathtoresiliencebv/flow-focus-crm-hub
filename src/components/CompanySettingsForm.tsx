
import React, { useState, useEffect } from 'react';
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { DefaultAttachmentsManager, type DefaultAttachment } from "@/components/DefaultAttachmentsManager";

// Define the form schema
const formSchema = z.object({
  company_name: z.string().min(2, {
    message: "Bedrijfsnaam moet minimaal 2 karakters bevatten.",
  }),
  address: z.string().min(5, {
    message: "Adres moet minimaal 5 karakters bevatten.",
  }),
  postal_code: z.string().min(6, {
    message: "Postcode moet minimaal 6 karakters bevatten.",
  }),
  city: z.string().min(2, {
    message: "Plaats moet minimaal 2 karakters bevatten.",
  }),
  country: z.string().min(2, {
    message: "Land moet minimaal 2 karakters bevatten.",
  }),
  kvk_number: z.string().optional(),
  btw_number: z.string().optional(),
  general_terms: z.string().optional(),
});

export const CompanySettingsForm = () => {
  const { toast } = useToast();
  const { settings, loading, saveSettings } = useCompanySettings();
  const [defaultAttachments, setDefaultAttachments] = useState<DefaultAttachment[]>([]);
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: "",
      address: "",
      postal_code: "",
      city: "",
      country: "Nederland",
      kvk_number: "",
      btw_number: "",
      general_terms: "",
    },
  });

  // Load settings into form when available
  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name || "",
        address: settings.address || "",
        postal_code: settings.postal_code || "",
        city: settings.city || "",
        country: settings.country || "Nederland",
        kvk_number: settings.kvk_number || "",
        btw_number: settings.btw_number || "",
        general_terms: settings.general_terms || "",
      });
      
      setDefaultAttachments(Array.isArray(settings.default_attachments) ? settings.default_attachments : []);
    }
  }, [settings, form]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await saveSettings({
        ...values,
        default_attachments: defaultAttachments,
      });
    } catch (error) {
      // Error handled by hook
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-medium mb-6">Bedrijfsgegevens</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrijfsnaam</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plaats</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="kvk_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KvK-nummer</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="btw_number"
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
            </div>
            
            <FormField
              control={form.control}
              name="general_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Algemene Voorwaarden</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Opslaan..." : "Instellingen opslaan"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      
      <DefaultAttachmentsManager
        value={defaultAttachments}
        onChange={setDefaultAttachments}
      />
    </div>
  );
};
