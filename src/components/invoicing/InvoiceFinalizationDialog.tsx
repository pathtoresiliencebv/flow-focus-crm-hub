import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface InvoiceFinalizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess: () => void;
}

export const InvoiceFinalizationDialog = ({ 
  isOpen, 
  onClose, 
  invoice, 
  onSuccess 
}: InvoiceFinalizationDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sendEmail: true,
    emailSubject: `Factuur ${invoice?.invoice_number} - ${invoice?.customer_name}`,
    emailMessage: `Beste ${invoice?.customer_name},\n\nHierbij ontvangt u de factuur.\n\nMet vriendelijke groet`,
    createProject: false,
    projectTitle: invoice?.project_title || ""
  });

  const handleCreatePaymentLink = async () => {
    if (!invoice) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-invoice-payment', {
        body: { invoice_id: invoice.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Betaallink aangemaakt",
          description: "De Stripe betaallink is geopend in een nieuw tabblad.",
        });
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast({
        title: "Fout bij betaallink",
        description: "Er is een fout opgetreden bij het aanmaken van de betaallink.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!invoice) return;

    setLoading(true);
    try {
      // Update invoice status to sent
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      // Send email if requested
      if (formData.sendEmail && invoice.customer_email) {
        const { error: emailError } = await supabase.functions.invoke('send-invoice-email', {
          body: {
            invoice_id: invoice.id,
            recipient: invoice.customer_email,
            subject: formData.emailSubject,
            message: formData.emailMessage
          }
        });

        if (emailError) {
          console.error('Email error:', emailError);
          toast({
            title: "Email niet verzonden",
            description: "Factuur is wel gefinaliseerd, maar email kon niet verzonden worden.",
            variant: "destructive"
          });
        }
      }

      // Create project if requested
      if (formData.createProject) {
        const { error: projectError } = await supabase
          .from('projects')
          .insert({
            title: formData.projectTitle,
            customer_id: invoice.customer_id,
            invoice_id: invoice.id,
            status: 'te-plannen'
          });

        if (projectError) {
          console.error('Project creation error:', projectError);
          toast({
            title: "Project niet aangemaakt",
            description: "Factuur is wel gefinaliseerd, maar project kon niet aangemaakt worden.",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Factuur gefinaliseerd",
        description: `Factuur ${invoice.invoice_number} is succesvol gefinaliseerd.`
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      toast({
        title: "Fout bij finaliseren",
        description: "Er is een fout opgetreden bij het finaliseren van de factuur.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Factuur Finaliseren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Factuur {invoice?.invoice_number} wordt gefinaliseerd en kan daarna niet meer aangepast worden.
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sendEmail"
              checked={formData.sendEmail}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, sendEmail: checked as boolean })
              }
            />
            <Label htmlFor="sendEmail">Email versturen naar klant</Label>
          </div>

          {formData.sendEmail && (
            <div className="space-y-3 pl-6">
              <div>
                <Label htmlFor="emailSubject">Email onderwerp</Label>
                <Input
                  id="emailSubject"
                  value={formData.emailSubject}
                  onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="emailMessage">Email bericht</Label>
                <Textarea
                  id="emailMessage"
                  value={formData.emailMessage}
                  onChange={(e) => setFormData({ ...formData, emailMessage: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="createProject"
              checked={formData.createProject}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, createProject: checked as boolean })
              }
            />
            <Label htmlFor="createProject">Project aanmaken</Label>
          </div>

          {formData.createProject && (
            <div className="pl-6">
              <Label htmlFor="projectTitle">Project titel</Label>
              <Input
                id="projectTitle"
                value={formData.projectTitle}
                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                placeholder="Voer project titel in..."
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleFinalize} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Finaliseren
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleCreatePaymentLink}
            disabled={loading || !invoice?.customer_email}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Betaallink Maken
          </Button>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};