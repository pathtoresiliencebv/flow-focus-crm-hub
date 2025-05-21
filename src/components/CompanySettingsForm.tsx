
import React, { useState } from 'react';
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
import { ImageUpload } from "@/components/ImageUpload";

// Define the form schema
const formSchema = z.object({
  companyName: z.string().min(2, {
    message: "Bedrijfsnaam moet minimaal 2 karakters bevatten.",
  }),
  address: z.string().min(5, {
    message: "Adres moet minimaal 5 karakters bevatten.",
  }),
  postalCode: z.string().min(6, {
    message: "Postcode moet minimaal 6 karakters bevatten.",
  }),
  city: z.string().min(2, {
    message: "Plaats moet minimaal 2 karakters bevatten.",
  }),
  country: z.string().min(2, {
    message: "Land moet minimaal 2 karakters bevatten.",
  }),
  phone: z.string().min(10, {
    message: "Telefoonnummer moet minimaal 10 karakters bevatten.",
  }),
  email: z.string().email({
    message: "Ongeldig e-mailadres.",
  }),
  website: z.string().url({
    message: "Ongeldige website URL.",
  }).optional().or(z.literal('')),
});

export const CompanySettingsForm = () => {
  const { toast } = useToast();
  const [logo, setLogo] = useState<string | null>(null);
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "Kozijnen Bedrijf B.V.",
      address: "Kozijnenstraat 123",
      postalCode: "1234 AB",
      city: "Amsterdam",
      country: "Nederland",
      phone: "020-1234567",
      email: "info@kozijnenbedrijf.nl",
      website: "https://www.kozijnenbedrijf.nl",
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, we would send this to the backend
    console.log("Company settings:", { ...values, logo });
    
    toast({
      title: "Bedrijfsgegevens opgeslagen",
      description: "Uw bedrijfsgegevens zijn succesvol bijgewerkt.",
    });
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-6">Bedrijfsgegevens</h2>
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Bedrijfslogo</label>
        <ImageUpload
          value={logo}
          onChange={setLogo}
          className="w-48 h-48"
        />
        <p className="text-sm text-gray-500 mt-2">
          Upload een logo (PNG, JPG, SVG, maximaal 2MB)
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="companyName"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mailadres</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefoonnummer</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
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
              name="postalCode"
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
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit">Instellingen opslaan</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
