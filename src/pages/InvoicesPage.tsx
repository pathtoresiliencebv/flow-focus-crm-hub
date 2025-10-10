import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { Invoicing } from "@/components/Invoicing";
import { Button } from "@/components/ui/button";
import { FileText, Wrench } from "lucide-react";

export default function InvoicesPage() {
  const { setTitle, setActions } = usePageHeader();
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'simple' | 'detailed'>('simple');

  // ✅ Use useCallback to create stable function references
  // Note: setState functions are stable and don't need to be in dependencies
  const handleNewInvoice = useCallback(() => {
    console.log('🟦 Normale Factuur button clicked!');
    setInvoiceType('simple');
    setShowNewInvoice(true);
    console.log('🟦 State updated to simple + true');
  }, []); // Empty dependencies - handlers are stable

  const handleNewWerkbon = useCallback(() => {
    console.log('🟧 Werkbon Factuur button clicked!');
    setInvoiceType('detailed');
    setShowNewInvoice(true);
    console.log('🟧 State updated to detailed + true');
  }, []); // Empty dependencies - handlers are stable

  useEffect(() => {
    console.log('📝 InvoicesPage: Setting up header with handlers');
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
      console.log('📝 InvoicesPage: Cleaning up header');
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions]); // Remove handlers from dependencies

  return (
    <Invoicing 
      invoiceType={invoiceType}
      showNewInvoice={showNewInvoice}
      onCloseNewInvoice={() => setShowNewInvoice(false)}
    />
  );
}

