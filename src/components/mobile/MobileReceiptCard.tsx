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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            In afwachting
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Goedgekeurd
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Afgekeurd
          </span>
        );
    }
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {receipt.description || receipt.fileName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {receipt.uploadDate}
            </p>
          </div>
          <div className="ml-2">
            {getStatusBadge(receipt.status)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div>
            <span className="text-muted-foreground">Categorie:</span>
            <p className="font-medium">{receipt.category || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Bedrag:</span>
            <p className="font-medium">{receipt.amount ? `€${receipt.amount}` : '-'}</p>
          </div>
        </div>

        {receipt.status === 'approved' && receipt.approvedBy && (
          <div className="text-xs text-muted-foreground mb-3">
            Goedgekeurd door: {receipt.approvedBy}
          </div>
        )}

        {receipt.status === 'rejected' && receipt.rejectionReason && (
          <div className="text-xs text-red-600 mb-3">
            Reden: {receipt.rejectionReason}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(receipt)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Bekijk
          </Button>

          {showActions && receipt.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => onApprove?.(receipt.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => onReject?.(receipt.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}

          {showActions && receipt.status !== 'pending' && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(receipt.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};