import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    project_title: "",
    message: "",
    subtotal: 0,
    vat_amount: 0,
    total_amount: 0
  });

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.status !== 'concept') {
        toast({
          title: "Niet bewerkbaar",
          description: "Alleen concept facturen kunnen bewerkt worden.",
          variant: "destructive"
        });
        navigate('/invoicing');
        return;
      }

      setInvoice(data);
      setFormData({
        customer_name: data.customer_name || "",
        customer_email: data.customer_email || "",
        project_title: data.project_title || "",
        message: data.message || "",
        subtotal: data.subtotal || 0,
        vat_amount: data.vat_amount || 0,
        total_amount: data.total_amount || 0
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: "Fout",
        description: "Kon factuur niet laden.",
        variant: "destructive"
      });
      navigate('/invoicing');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
          auto_saved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Factuur opgeslagen",
        description: "De wijzigingen zijn succesvol opgeslagen."
      });

      navigate('/invoicing');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Factuur laden...</div>;
  }

  if (!invoice) {
    return <div>Factuur niet gevonden</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/invoicing')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar Facturen
        </Button>
        <h1 className="text-2xl font-bold">Factuur Bewerken: {invoice.invoice_number}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factuur Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Klant Naam</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customer_email">Klant Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="project_title">Project Titel</Label>
            <Input
              id="project_title"
              value={formData.project_title}
              onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="message">Bericht</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subtotal">Subtotaal</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="vat_amount">BTW Bedrag</Label>
              <Input
                id="vat_amount"
                type="number"
                step="0.01"
                value={formData.vat_amount}
                onChange={(e) => setFormData({ ...formData, vat_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="total_amount">Totaal Bedrag</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Save className="mr-2 h-4 w-4 animate-spin" />}
          Opslaan
        </Button>
        <Button variant="outline" onClick={() => navigate('/invoicing')}>
          Annuleren
        </Button>
      </div>
    </div>
  );
};