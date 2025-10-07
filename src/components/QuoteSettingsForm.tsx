
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Building } from "lucide-react";
import { DefaultAttachmentsManager } from "./DefaultAttachmentsManager";

interface DefaultAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface QuoteSettingsFormData {
  terms_and_conditions: string;
  company_name: string;
  company_address: string;
  company_postal_code: string;
  company_city: string;
  company_country: string;
  company_vat_number: string;
  company_kvk_number: string;
}

export function QuoteSettingsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [defaultAttachments, setDefaultAttachments] = useState<DefaultAttachment[]>([]);

  const form = useForm<QuoteSettingsFormData>({
    defaultValues: {
      terms_and_conditions: '',
      company_name: 'SMANS BV',
      company_address: 'Bedrijfsstraat 123',
      company_postal_code: '1234 AB',
      company_city: 'Amsterdam',
      company_country: 'Nederland',
      company_vat_number: 'NL123456789B01',
      company_kvk_number: '12345678',
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        setSettingsId(data.id);
        form.reset({
          terms_and_conditions: data.terms_and_conditions || '',
          company_name: data.company_name || 'SMANS BV',
          company_address: data.company_address || 'Bedrijfsstraat 123',
          company_postal_code: data.company_postal_code || '1234 AB',
          company_city: data.company_city || 'Amsterdam',
          company_country: data.company_country || 'Nederland',
          company_vat_number: data.company_vat_number || 'NL123456789B01',
          company_kvk_number: data.company_kvk_number || '12345678',
        });
        
        // Load default attachments
        if (data.default_attachments) {
          setDefaultAttachments(data.default_attachments);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const onSubmit = async (data: QuoteSettingsFormData) => {
    setLoading(true);
    try {
      console.log('💾 Saving quote settings...', { data, defaultAttachments });
      
      if (settingsId) {
        // Update existing settings
        console.log('📝 Updating existing settings with ID:', settingsId);
        const { data: updatedData, error } = await supabase
          .from('quote_settings')
          .update({
            ...data,
            default_attachments: defaultAttachments,
            updated_at: new Date().toISOString()
          })
          .eq('id', settingsId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating settings:', error);
          toast({
            title: "Fout bij opslaan",
            description: `Er is een fout opgetreden: ${error.message}`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log('✅ Settings updated successfully:', updatedData);
      } else {
        // Create new settings
        console.log('➕ Creating new settings...');
        const { data: newSettings, error } = await supabase
          .from('quote_settings')
          .insert([{
            ...data,
            default_attachments: defaultAttachments
          }])
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating settings:', error);
          toast({
            title: "Fout bij opslaan",
            description: `Er is een fout opgetreden: ${error.message}`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (newSettings) {
          console.log('✅ Settings created successfully:', newSettings);
          setSettingsId(newSettings.id);
        }
      }

      toast({
        title: "Instellingen opgeslagen",
        description: "De offerte instellingen zijn succesvol opgeslagen.",
      });
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Fout",
        description: error instanceof Error ? error.message : "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bedrijfsgegevens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="company_address"
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
                  name="company_postal_code"
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
                  name="company_city"
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
                  name="company_country"
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
                  name="company_vat_number"
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
                  name="company_kvk_number"
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
              </div>

              <FormField
                control={form.control}
                name="terms_and_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Algemene Voorwaarden</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Voer hier uw algemene voorwaarden in..."
                        className="min-h-[300px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Bezig met opslaan..." : "Instellingen opslaan"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Default Attachments Section */}
      <DefaultAttachmentsManager
        value={defaultAttachments}
        onChange={setDefaultAttachments}
      />
    </div>
  );
}
