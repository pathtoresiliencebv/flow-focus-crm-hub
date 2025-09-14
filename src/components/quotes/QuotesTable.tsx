
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, ExternalLink, Trash2, CheckCircle, Mail, Copy, Pencil, FileSignature, RotateCcw } from "lucide-react";
import { Quote } from '@/types/quote';

interface QuotesTableProps {
  quotes: Quote[];
  onPreview: (quote: Quote) => void;
  onViewPublic: (publicToken: string) => void;
  onDelete: (quoteId: string) => void;
  onApprove?: (quote: Quote) => void;
  onSendEmail?: (quote: Quote) => void;
  onDuplicate?: (quoteId: string) => void;
  onRestore?: (quoteId: string) => void;
  isArchived?: boolean;
}

export const QuotesTable: React.FC<QuotesTableProps> = ({
  quotes,
  onPreview,
  onViewPublic,
  onDelete,
  onApprove,
  onSendEmail,
  onDuplicate,
  onRestore,
  isArchived = false
}) => {
  const navigate = useNavigate();
  const getStatusBadge = (status: string) => {
    const statusColors = {
      'concept': 'bg-gray-100 text-gray-800',
      'verstuurd': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
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
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                {quote.quote_number}
                {(quote.client_signature_data || quote.admin_signature_data) && (
                  <FileSignature className="h-4 w-4 text-green-600" />
                )}
              </div>
            </TableCell>
            <TableCell>{quote.customer_name}</TableCell>
            <TableCell>{quote.project_title || '-'}</TableCell>
            <TableCell>{new Date(quote.quote_date).toLocaleDateString('nl-NL')}</TableCell>
            <TableCell>{new Date(quote.valid_until).toLocaleDateString('nl-NL')}</TableCell>
            <TableCell>€{(quote.total_amount + quote.total_vat_amount).toFixed(2)}</TableCell>
            <TableCell>{getStatusBadge(quote.status)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {!isArchived && quote.status === 'concept' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/quotes/${quote.id}/edit`)}
                    title="Bewerk offerte"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreview(quote)}
                  title="Preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {!isArchived && quote.public_token && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPublic(quote.public_token!)}
                    title="Bekijk publieke link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {!isArchived && quote.status === 'concept' && onSendEmail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSendEmail(quote)}
                    title="Verstuur per email"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                )}
                {!isArchived && (quote.status === 'concept' || quote.status === 'verstuurd') && onApprove && (
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
                {!isArchived && onDuplicate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicate(quote.id!)}
                    title="Dupliceer offerte"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {isArchived && onRestore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestore(quote.id!)}
                    title="Herstel offerte"
                    className="text-green-600 hover:text-green-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(quote.id!)}
                  title={isArchived ? "Permanent verwijderen" : "Naar prullenbak"}
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
