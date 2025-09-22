import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle, Mail, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceFinalizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onFinalized?: () => void;
}

export const InvoiceFinalizationDialog: React.FC<InvoiceFinalizationDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  onFinalized
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailCustomer, setEmailCustomer] = useState(true);
  const [createProject, setCreateProject] = useState(false);

  const handleFinalize = async () => {
    if (!invoice) return;

    setIsLoading(true);
    try {
      // Generate final invoice number if it's still a concept
      let invoiceNumber = invoice.invoice_number;
      if (invoice.status === 'concept') {
        const { data: newNumber } = await supabase.rpc('generate_invoice_number');
        if (newNumber) {
          invoiceNumber = newNumber;
        }
      }

      // Update invoice status and number
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          invoice_number: invoiceNumber,
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (updateError) {
        throw updateError;
      }

      // Send email if requested
      if (emailCustomer && invoice.customer_email) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-invoice-email', {
            body: {
              invoiceId: invoice.id,
              to: invoice.customer_email,
              subject: `Factuur ${invoiceNumber} - SMANS BV`,
              message: `Beste ${invoice.customer_name},

Hierbij ontvangt u factuur ${invoiceNumber} voor ${invoice.project_title || 'uw project'}.

De factuur is te vinden in de bijlage van deze email.

Voor vragen kunt u altijd contact met ons opnemen.

Met vriendelijke groet,
SMANS BV`
            }
          });

          if (emailError) {
            console.error('Email error:', emailError);
            toast({
              title: "Factuur gefinaliseerd",
              description: "Factuur is gefinaliseerd, maar email kon niet worden verzonden.",
              variant: "destructive",
            });
          }
        } catch (emailError) {
          console.error('Email error:', emailError);
        }
      }

      // Create project if requested (only if no project exists for source quote)
      if (createProject && invoice.source_quote_id) {
        try {
          // Check if project already exists
          const { data: existingProject } = await supabase
            .from('projects')
            .select('id')
            .eq('quote_id', invoice.source_quote_id)
            .maybeSingle();

          if (!existingProject) {
            // Trigger quote approval automation to create project
            const { error: automationError } = await supabase.functions.invoke('quote-approval-automation', {
              body: { quote_id: invoice.source_quote_id }
            });

            if (automationError) {
              console.error('Project creation error:', automationError);
            }
          }
        } catch (projectError) {
          console.error('Project creation error:', projectError);
        }
      }

      toast({
        title: "Factuur gefinaliseerd!",
        description: `Factuur ${invoiceNumber} is succesvol gefinaliseerd${emailCustomer ? ' en verzonden' : ''}.`,
      });

      onFinalized?.();
      onClose();
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      toast({
        title: "Fout bij finaliseren",
        description: "Er is een fout opgetreden bij het finaliseren van de factuur.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Factuur finaliseren
          </DialogTitle>
          <DialogDescription>
            Factuur {invoice.invoice_number} klaar maken voor verzending
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Wat gebeurt er bij finaliseren:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Status wordt bijgewerkt naar "Verzonden"</li>
              <li>• Definitief factuurnummer wordt gegenereerd</li>
              <li>• Factuur kan niet meer worden bewerkt</li>
              {emailCustomer && <li>• Email wordt verzonden naar klant</li>}
              {createProject && <li>• Project wordt aangemaakt (indien nog niet bestaat)</li>}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email"
                checked={emailCustomer}
                onCheckedChange={(checked) => setEmailCustomer(checked === true)}
                disabled={!invoice.customer_email}
              />
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail naar klant versturen
                {!invoice.customer_email && (
                  <span className="text-red-500 text-xs">(geen email adres)</span>
                )}
              </Label>
            </div>

            {invoice.source_quote_id && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="project"
                  checked={createProject}
                  onCheckedChange={(checked) => setCreateProject(checked === true)}
                />
                <Label htmlFor="project" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Project aanmaken (indien nog niet bestaat)
                </Label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              onClick={handleFinalize}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading ? 'Bezig met finaliseren...' : 'Finaliseren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};