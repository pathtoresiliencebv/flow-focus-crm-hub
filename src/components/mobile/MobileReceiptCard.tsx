import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, Eye, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Receipt {
  id: string;
  fileName: string;
  uploadDate: string;
  amount?: string;
  description?: string;
  category?: string;
  fileData: string;
  fileType: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface MobileReceiptCardProps {
  receipt: Receipt;
  onView: (receipt: Receipt) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const MobileReceiptCard = ({ 
  receipt, 
  onView, 
  onApprove, 
  onReject, 
  onDelete,
  showActions = false 
}: MobileReceiptCardProps) => {
  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            In afwachting
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Goedgekeurd
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Afgekeurd
          </span>
        );
    }
  };

  return (
    <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-white">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-semibold text-base truncate text-foreground mb-1">
              {receipt.description || receipt.fileName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {receipt.uploadDate}
            </p>
          </div>
          <div className="flex-shrink-0">
            {getStatusBadge(receipt.status)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground block">Categorie:</span>
            <p className="font-medium text-base">{receipt.category || '-'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground block">Bedrag:</span>
            <p className="font-medium text-base">{receipt.amount ? `€${receipt.amount}` : '-'}</p>
          </div>
        </div>

        {receipt.status === 'approved' && receipt.approvedBy && (
          <div className="text-sm text-muted-foreground mb-4 p-3 bg-green-50 rounded-lg">
            <strong>Goedgekeurd door:</strong> {receipt.approvedBy}
          </div>
        )}

        {receipt.status === 'rejected' && receipt.rejectionReason && (
          <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">
            <strong>Reden:</strong> {receipt.rejectionReason}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onView(receipt)}
            className="flex-1 h-12 text-base font-medium touch-manipulation active:scale-95 transition-all duration-200"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Eye className="h-5 w-5 mr-2" />
            Bekijk
          </Button>

          {showActions && receipt.status === 'pending' && (
            <>
              <Button
                size="lg"
                onClick={() => onApprove?.(receipt.id)}
                className="h-12 w-12 bg-green-600 hover:bg-green-700 text-white touch-manipulation active:scale-95 transition-all duration-200 p-0"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Check className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                onClick={() => onReject?.(receipt.id)}
                className="h-12 w-12 bg-red-600 hover:bg-red-700 text-white touch-manipulation active:scale-95 transition-all duration-200 p-0"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          )}

          {showActions && receipt.status !== 'pending' && onDelete && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => onDelete(receipt.id)}
              className="h-12 w-12 text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation active:scale-95 transition-all duration-200 p-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};