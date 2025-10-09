import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { useI18n } from "@/contexts/I18nContext";
import { Invoicing } from "@/components/Invoicing";
import { Button } from "@/components/ui/button";
import { FileText, Wrench } from "lucide-react";

export default function InvoicesPage() {
  const { setTitle, setActions } = usePageHeader();
  const { t } = useI18n();
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'simple' | 'detailed'>('simple');

  // ✅ Use useCallback to create stable function references
  const handleNewInvoice = useCallback(() => {
    console.log('🟦 Normale Factuur button clicked!');
    console.log('🟦 Current state:', { showNewInvoice, invoiceType });
    setInvoiceType('simple');
    setShowNewInvoice(true);
    console.log('🟦 State updated to simple + true');
  }, [showNewInvoice, invoiceType]);

  const handleNewWerkbon = useCallback(() => {
    console.log('🟧 Werkbon Factuur button clicked!');
    console.log('🟧 Current state:', { showNewInvoice, invoiceType });
    setInvoiceType('detailed');
    setShowNewInvoice(true);
    console.log('🟧 State updated to detailed + true');
  }, [showNewInvoice, invoiceType]);

  useEffect(() => {
    console.log('📝 InvoicesPage: Setting up header with handlers');
    setTitle(t('nav_invoices', 'Facturatie'));
    setActions(
      <>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleNewInvoice}
        >
          <FileText className="h-4 w-4 mr-2" />
          {t('button_simple_invoice', 'Normale Factuur')}
        </Button>
        <Button 
          size="sm" 
          className="bg-[hsl(0,71%,36%)] hover:bg-[hsl(0,71%,30%)] text-white"
          onClick={handleNewWerkbon}
        >
          <Wrench className="h-4 w-4 mr-2" />
          {t('button_workorder_invoice', 'Werkbon Factuur')}
        </Button>
      </>
    );
    return () => {
      console.log('📝 InvoicesPage: Cleaning up header');
      setTitle("");
      setActions(null);
    };
  }, [setTitle, setActions, handleNewInvoice, handleNewWerkbon, t]);

  return (
    <Invoicing 
      invoiceType={invoiceType}
      showNewInvoice={showNewInvoice}
      onCloseNewInvoice={() => setShowNewInvoice(false)}
    />
  );
}

