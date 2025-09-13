import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Send, Eye } from "lucide-react";
import { Invoice } from "@/hooks/useInvoices";

interface GroupedInvoicesViewProps {
  invoices: Invoice[];
  onSendInvoice: (invoiceId: string) => void;
  onViewInvoice: (invoiceId: string) => void;
  getStatusBadge: (status: string) => string;
}

interface QuoteGroup {
  quoteId: string | null;
  quoteName: string;
  invoices: Invoice[];
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'partial' | 'completed';
}

export const GroupedInvoicesView = ({ 
  invoices, 
  onSendInvoice, 
  onViewInvoice, 
  getStatusBadge 
}: GroupedInvoicesViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group invoices by source quote
  const groupedInvoices = invoices.reduce((groups: { [key: string]: QuoteGroup }, invoice) => {
    const key = invoice.source_quote_id || 'standalone';
    const groupName = invoice.project_title || invoice.customer_name || 'Standaard Factuur';
    
    if (!groups[key]) {
      groups[key] = {
        quoteId: invoice.source_quote_id,
        quoteName: groupName,
        invoices: [],
        totalAmount: 0,
        paidAmount: 0,
        status: 'pending'
      };
    }
    
    groups[key].invoices.push(invoice);
    groups[key].totalAmount += invoice.total_amount;
    
    if (invoice.status === 'betaald') {
      groups[key].paidAmount += invoice.total_amount;
    }
    
    return groups;
  }, {});

  // Calculate group status
  Object.values(groupedInvoices).forEach(group => {
    const paidPercentage = group.paidAmount / group.totalAmount;
    if (paidPercentage === 1) {
      group.status = 'completed';
    } else if (paidPercentage > 0) {
      group.status = 'partial';
    } else {
      group.status = 'pending';
    }
  });

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGroupStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Volledig betaald';
      case 'partial':
        return 'Gedeeltelijk betaald';
      case 'pending':
        return 'In behandeling';
      default:
        return 'Onbekend';
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedInvoices).map(([groupKey, group]) => {
        const isExpanded = expandedGroups.has(groupKey);
        const hasMultipleInvoices = group.invoices.length > 1;
        
        return (
          <Card key={groupKey} className="overflow-hidden">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <CardHeader 
                  className={`cursor-pointer hover:bg-gray-50 transition-colors ${!hasMultipleInvoices ? 'pb-2' : ''}`}
                  onClick={() => hasMultipleInvoices && toggleGroup(groupKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasMultipleInvoices && (
                        <div className="text-gray-400">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{group.quoteName}</CardTitle>
                        {hasMultipleInvoices && (
                          <div className="text-sm text-gray-600 mt-1">
                            {group.invoices.length} termijnfacturen
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">€{group.totalAmount.toFixed(2)}</div>
                        {hasMultipleInvoices && (
                          <div className="text-sm text-gray-600">
                            €{group.paidAmount.toFixed(2)} betaald
                          </div>
                        )}
                      </div>
                      <Badge className={getGroupStatusBadge(group.status)}>
                        {getGroupStatusText(group.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              {hasMultipleInvoices ? (
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {group.invoices.map((invoice, index) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-gray-500">
                              {index + 1}/{group.invoices.length}
                            </div>
                            <div>
                              <div className="font-medium">{invoice.invoice_number}</div>
                              <div className="text-sm text-gray-600">
                                Vervaldatum: {new Date(invoice.due_date).toLocaleDateString('nl-NL')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium">€{invoice.total_amount.toFixed(2)}</div>
                              {invoice.payment_term_sequence && (
                                <div className="text-xs text-gray-500">
                                  Termijn {invoice.payment_term_sequence}
                                </div>
                              )}
                            </div>
                            <Badge className={getStatusBadge(invoice.status)}>
                              {invoice.status}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewInvoice(invoice.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSendInvoice(invoice.id)}
                                disabled={invoice.status === 'betaald'}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              ) : (
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{group.invoices[0].invoice_number}</div>
                      <div className="text-sm text-gray-600">
                        Vervaldatum: {new Date(group.invoices[0].due_date).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewInvoice(group.invoices[0].id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSendInvoice(group.invoices[0].id)}
                        disabled={group.invoices[0].status === 'betaald'}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};