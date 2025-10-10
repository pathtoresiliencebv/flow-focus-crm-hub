import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from '@/components/InvoiceForm';
import { useCrmStore } from "@/hooks/useCrmStore";

export default function NewInvoice() {
  const navigate = useNavigate();
  const { customers, projects } = useCrmStore();

  React.useEffect(() => {
    console.log('📄 NewInvoice page loaded:', {
      path: window.location.pathname
    });
  }, []);

  const handleClose = () => {
    navigate('/?tab=invoices'); // Go back to invoices list
  };

  const formCustomers = customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email || ''
  }));

  const formProjects = projects.map(project => ({
    id: project.id,
    title: project.title,
    value: project.value?.toString() || '0',
    customer: project.customer
  }));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Button>
          <h1 className="text-2xl font-bold">Nieuwe factuur aanmaken</h1>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <InvoiceForm 
            onClose={handleClose}
            customers={formCustomers}
            projects={formProjects}
          />
        </div>
      </div>
    </div>
  );
}