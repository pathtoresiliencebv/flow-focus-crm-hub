
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface InvoicingHeaderProps {
  customers: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; title: string; value: string; customer: string }>;
}

export const InvoicingHeader = ({ customers, projects }: InvoicingHeaderProps) => {
  const navigate = useNavigate();

  const handleNewInvoice = () => {
    navigate('/invoices/new');
  };

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Facturering</h2>
      <Button onClick={handleNewInvoice}>
        <FileText className="mr-2 h-4 w-4" />
        Nieuwe Factuur
      </Button>
    </div>
  );
};
