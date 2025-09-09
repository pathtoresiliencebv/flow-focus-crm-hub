
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvoiceForm } from '@/components/InvoiceForm';
import { FileText } from "lucide-react";

interface InvoicingHeaderProps {
  customers: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; title: string; value: string; customer: string }>;
}

export const InvoicingHeader = ({ customers, projects }: InvoicingHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Facturering</h2>
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Nieuwe Factuur
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1400px]">
          <DialogHeader>
            <DialogTitle>Nieuwe factuur aanmaken</DialogTitle>
            <DialogDescription>
              Vul de factuurgegevens in en bekijk direct de preview van je factuur.
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm 
            onClose={() => {
              const dialogCloseButton = document.querySelector('[data-state="open"] button[aria-label="Close"]');
              if (dialogCloseButton instanceof HTMLElement) {
                dialogCloseButton.click();
              }
            }}
            customers={customers}
            projects={projects}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
