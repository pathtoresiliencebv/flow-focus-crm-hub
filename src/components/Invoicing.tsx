

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useInvoices } from '@/hooks/useInvoices';
import { useCrmStore } from "@/hooks/useCrmStore";
import { InvoicingHeader } from './invoicing/InvoicingHeader';
import { InvoiceFilters } from './invoicing/InvoiceFilters';
import { InvoicesTable } from './invoicing/InvoicesTable';
import { InvoicesSummary } from './invoicing/InvoicesSummary';
import { GroupedInvoicesView } from './invoicing/GroupedInvoicesView';

export function Invoicing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customers, projects } = useCrmStore();
  const { invoices, loading, fetchInvoiceItems, updateInvoiceStatus } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Filter invoices based on search term and status filter
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.project_title && invoice.project_title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === null || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "betaald":
        return "bg-green-100 text-green-800";
      case "verzonden":
        return "bg-blue-100 text-blue-800";
      case "concept":
        return "bg-gray-100 text-gray-800";
      case "verlopen":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handler for sending invoice
  const handleSendInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}/send`);
  };

  // Handler for viewing invoice details
  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}/details`);
  };

  // Convert customers and projects to the format expected by InvoicingHeader
  const formCustomers = customers.map(customer => ({
    id: customer.id, // Keep as string UUID
    name: customer.name
  }));

  const formProjects = projects.map(project => ({
    id: project.id, // Keep as string UUID
    title: project.title,
    value: project.value?.toString() || '0',
    customer: project.customer
  }));

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <InvoicingHeader customers={formCustomers} projects={formProjects} />

      <InvoiceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Facturen</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grouped' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grouped')}
          >
            Gegroepeerd
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Tabel
          </Button>
        </div>
      </div>

      {viewMode === 'grouped' ? (
        <GroupedInvoicesView
          invoices={filteredInvoices}
          onViewInvoice={handleViewInvoice}
          onSendInvoice={handleSendInvoice}
          getStatusBadge={getStatusBadge}
        />
      ) : (
        <InvoicesTable
          invoices={filteredInvoices}
          onViewInvoice={handleViewInvoice}
          onSendInvoice={handleSendInvoice}
          getStatusBadge={getStatusBadge}
        />
      )}
      
      <InvoicesSummary invoices={filteredInvoices} />
    </div>
  );
}

