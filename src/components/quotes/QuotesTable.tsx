
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, ExternalLink, Trash2, CheckCircle } from "lucide-react";
import { Quote } from '@/types/quote';

interface QuotesTableProps {
  quotes: Quote[];
  onPreview: (quote: Quote) => void;
  onViewPublic: (publicToken: string) => void;
  onDelete: (quoteId: string) => void;
  onApprove?: (quote: Quote) => void;
}

export const QuotesTable: React.FC<QuotesTableProps> = ({
  quotes,
  onPreview,
  onViewPublic,
  onDelete,
  onApprove
}) => {
  const getStatusBadge = (status: string) => {
    const statusColors = {
      'concept': 'bg-gray-100 text-gray-800',
      'verstuurd': 'bg-blue-100 text-blue-800',
      'geaccepteerd': 'bg-green-100 text-green-800',
      'afgewezen': 'bg-red-100 text-red-800',
      'verlopen': 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Offertenummer</TableHead>
          <TableHead>Klant</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Datum</TableHead>
          <TableHead>Geldig tot</TableHead>
          <TableHead>Bedrag</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-medium">{quote.quote_number}</TableCell>
            <TableCell>{quote.customer_name}</TableCell>
            <TableCell>{quote.project_title || '-'}</TableCell>
            <TableCell>{new Date(quote.quote_date).toLocaleDateString('nl-NL')}</TableCell>
            <TableCell>{new Date(quote.valid_until).toLocaleDateString('nl-NL')}</TableCell>
            <TableCell>€{(quote.total_amount + quote.total_vat_amount).toFixed(2)}</TableCell>
            <TableCell>{getStatusBadge(quote.status)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreview(quote)}
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {quote.public_token && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPublic(quote.public_token!)}
                    title="Bekijk publieke link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {quote.status === 'verstuurd' && onApprove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApprove(quote)}
                    title="Goedkeuren en omzetten naar factuur"
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(quote.id!)}
                  title="Verwijderen"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
