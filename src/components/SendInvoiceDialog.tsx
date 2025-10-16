
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Eye } from "lucide-react";

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (emailData: { to: string; subject: string; message: string }) => void;
  invoiceNumber: string;
  customerEmail: string;
  customerName: string;
  type: 'invoice' | 'quote';
}

export function SendInvoiceDialog({ 
  open, 
  onOpenChange, 
  onSend, 
  invoiceNumber, 
  customerEmail, 
  customerName,
  type 
}: SendInvoiceDialogProps) {
  const [emailTo, setEmailTo] = useState(customerEmail);
  const [subject, setSubject] = useState(
    `${type === 'invoice' ? 'Factuur' : 'Offerte'} ${invoiceNumber} - Onderhoud en Service J.J.P. Smans`
  );
  const [message, setMessage] = useState(
    `Beste ${customerName},\n\nHierbij ontvangt u ${type === 'invoice' ? 'factuur' : 'offerte'} ${invoiceNumber}.\n\nMet vriendelijke groet,\nOnderhoud en Service J.J.P. Smans`
  );

  const handleSend = () => {
    onSend({ to: emailTo, subject, message });
  };

  const handlePreviewPDF = () => {
    // In een echte implementatie zou hier de PDF preview geopend worden
    alert("PDF preview wordt geopend...");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'invoice' ? 'Factuur' : 'Offerte'} verzenden
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-to">Naar</Label>
            <Input
              id="email-to"
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="E-mailadres ontvanger"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Onderwerp</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="E-mail onderwerp"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Bericht</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="E-mail bericht"
              rows={6}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">Bijlage:</p>
              <p className="text-sm text-gray-600">
                {type === 'invoice' ? 'Factuur' : 'Offerte'} {invoiceNumber}.pdf
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handlePreviewPDF}>
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSend} disabled={!emailTo || !subject}>
            <Send className="h-4 w-4 mr-2" />
            Verzenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
