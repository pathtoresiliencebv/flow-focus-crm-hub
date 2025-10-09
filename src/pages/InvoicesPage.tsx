import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Invoicing } from "@/components/Invoicing";
import { Button } from "@/components/ui/button";
import { FileText, Wrench } from "lucide-react";

export default function InvoicesPage() {
  const { setTitle, setActions } = usePageHeader();
  const navigate = useNavigate();
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'simple' | 'detailed'>('simple');

  const handleNewInvoice = () => {
    setInvoiceType('simple');
    setShowNewInvoice(true);
  };

  const handleNewWerkbon = () => {
    setInvoiceType('detailed');
    setShowNewInvoice(true);
  };

  useEffect(() => {
    setTitle("Facturatie");
    setActions(
      <>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleNewInvoice}
        >
          <FileText className="h-4 w-4 mr-2" />
          Normale Factuur
        </Button>
        <Button 
          size="sm" 
          className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
          onClick={handleNewWerkbon}
        >
          <Wrench className="h-4 w-4 mr-2" />
          Werkbon Factuur
        </Button>
      </>
    );
    return () => {
      setTitle("");
      setActions(null);
    };
  }, [navigate, setTitle, setActions]);

  return (
    <Invoicing 
      invoiceType={invoiceType}
      showNewInvoice={showNewInvoice}
      onCloseNewInvoice={() => setShowNewInvoice(false)}
    />
  );
}

