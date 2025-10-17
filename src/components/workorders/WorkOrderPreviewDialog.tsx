import React from 'react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FileText, Calendar, User, Image as ImageIcon } from 'lucide-react';

interface WorkOrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: any | null;
}

export const WorkOrderPreviewDialog: React.FC<WorkOrderPreviewDialogProps> = ({
  open,
  onOpenChange,
  workOrder
}) => {
  if (!workOrder) return null;

  return (
    <SlidePanel
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={`Werkbon - ${workOrder.work_order_number || ''}`}
      size="xl"
    >
      <div className="h-full overflow-y-auto p-6 space-y-6">
        {/* Header Info */}
        <Card className="p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-emerald-800">
              {workOrder.work_order_number}
            </h2>
            <Badge className="bg-emerald-600">Voltooid</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">Datum:</span>
              <span className="font-medium">
                {workOrder.signed_at ? format(new Date(workOrder.signed_at), 'dd MMM yyyy - HH:mm', { locale: nl }) : 'Onbekend'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">Klant:</span>
              <span className="font-medium">{workOrder.client_name || 'Onbekend'}</span>
            </div>
          </div>
        </Card>

        {/* Summary Text */}
        {workOrder.summary_text && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Samenvatting Werkzaamheden
            </h3>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {workOrder.summary_text}
            </div>
          </Card>
        )}

        {/* Work Photos */}
        {workOrder.work_photos && workOrder.work_photos.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-600" />
              Foto's ({workOrder.work_photos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {workOrder.work_photos.map((photo: any, index: number) => (
                <div key={index} className="space-y-2">
                  <img
                    src={photo.url}
                    alt={photo.description || `Foto ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  {photo.description && (
                    <p className="text-xs text-muted-foreground">{photo.description}</p>
                  )}
                  {photo.category && (
                    <Badge variant="outline" className="text-xs">
                      {photo.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-4">
          {/* Client Signature */}
          {workOrder.client_signature_data && (
            <Card className="p-4">
              <h4 className="font-medium text-sm mb-3 text-muted-foreground">Handtekening Klant</h4>
              <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50">
                <img
                  src={workOrder.client_signature_data}
                  alt="Klant handtekening"
                  className="max-h-32 mx-auto"
                />
              </div>
              <p className="text-sm text-center mt-2 text-muted-foreground">
                {workOrder.client_name}
              </p>
            </Card>
          )}
        </div>

        {/* PDF Download */}
        {workOrder.pdf_url && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-blue-800">PDF Werkbon</h3>
                <p className="text-sm text-blue-600">Download de volledige werkbon als PDF</p>
              </div>
              <a
                href={workOrder.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </a>
            </div>
          </Card>
        )}
      </div>
    </SlidePanel>
  );
};

