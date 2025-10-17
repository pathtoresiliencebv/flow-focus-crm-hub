import React, { useEffect, useState } from 'react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Calendar,
  User,
  Image as ImageIcon,
  CheckCircle,
  Receipt as ReceiptIcon,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkOrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: any | null;
}

// Helper to fetch installer profile
const fetchInstallerProfile = async (installerId: string) => {
  if (!installerId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', installerId)
    .single();
  if (error) {
    console.error('Error fetching installer profile:', error);
    return null;
  }
  return data;
};

export const WorkOrderPreviewDialog: React.FC<WorkOrderPreviewDialogProps> = ({
  open,
  onOpenChange,
  workOrder
}) => {
  const [completionData, setCompletionData] = useState<any>(null);
  const [installerProfile, setInstallerProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();

  // Fetch all related data when dialog opens
  useEffect(() => {
    if (!open || !workOrder) return;

    const fetchWorkOrderData = async () => {
      if (!open || !workOrder) return;
      setLoading(true);
      try {
        // Prefer the completion linked directly to this work order
        let currentCompletion: any | null = null;
        if ((workOrder as any).completion_id) {
          const { data: completionById, error: cErr } = await supabase
            .from('project_completions')
            .select('*')
            .eq('id', (workOrder as any).completion_id)
            .single();
          if (!cErr && completionById) currentCompletion = completionById;
        }

        // Fallback: most recent completion for this project
        if (!currentCompletion) {
          const { data: completions } = await supabase
            .from('project_completions')
            .select('*')
            .eq('project_id', workOrder.project_id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (completions && completions.length > 0) currentCompletion = completions[0];
        }

        if (currentCompletion) {
          setCompletionData(currentCompletion);

          // Fetch installer profile
          if (currentCompletion.installer_id) {
            const profile = await fetchInstallerProfile(currentCompletion.installer_id);
            setInstallerProfile(profile);
          }

          // Photos tied to this exact work order
          const [{ data: completionPhotos }, { data: workOrderPhotos }] = await Promise.all([
            supabase
              .from('completion_photos')
              .select('*')
              .eq('completion_id', currentCompletion.id),
            supabase
              .from('project_photos')
              .select('*')
              .eq('work_order_id', workOrder.id),
          ]);

          // Combine and remove duplicates by id
          const allPhotos = [...(completionPhotos || []), ...(workOrderPhotos || [])];
          const uniquePhotos = Array.from(new Set(allPhotos.map(p => p.id))).map(id => allPhotos.find(p => p.id === id));
          setPhotos(uniquePhotos || []);
        }

        // Fetch tasks only for this work order to mirror executed tasks
        const { data: tasksData } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('work_order_id', workOrder.id)
          .order('created_at', { ascending: false });
        setTasks(tasksData || []);

        // Receipts can remain at project-level
        const { data: receiptsData } = await supabase
          .from('project_receipts')
          .select('*')
          .eq('project_id', workOrder.project_id)
          .order('created_at', { ascending: false });
        setReceipts(receiptsData || []);

      } catch (error) {
        console.error('Error fetching work order data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrderData();
  }, [open, workOrder]);

  if (!workOrder) return null;

  return (
    <SlidePanel
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={`Werkbon - ${workOrder.work_order_number || ''}`}
      size="xl"
    >
      <div className="h-full overflow-y-auto p-6 space-y-6">
        {loading && (
          <div className="text-center py-8">
            <p>Laden...</p>
          </div>
        )}

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

        {/* Completed Tasks */}
        {tasks.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Uitgevoerde Taken ({tasks.filter(t => t.is_completed).length}/{tasks.length})
            </h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {task.is_completed ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${task.is_completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {task.block_title || task.task_description}
                    </p>
                    {task.task_description && task.block_title && (
                      <p className="text-sm text-muted-foreground">{task.task_description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Samenvatting from Completion */}
        {completionData?.work_performed && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Samenvatting Werkzaamheden
            </h3>
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {completionData.work_performed}
            </div>
            {completionData.recommendations && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Aanbevelingen:</h4>
                <p className="text-sm text-muted-foreground">{completionData.recommendations}</p>
              </div>
            )}
          </Card>
        )}

        {/* Foto's */}
        {photos.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-emerald-600" />
              Foto's ({photos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="cursor-pointer hover:opacity-80 transition-opacity group relative"
                  onClick={() => window.open(photo.photo_url, '_blank')}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.description || 'Werkfoto'}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  {photo.description && (
                    <p className="text-xs text-muted-foreground mt-1">{photo.description}</p>
                  )}
                  {photo.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {photo.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bonnetjes */}
        {receipts.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-emerald-600" />
              Bonnetjes ({receipts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receipts.map((receipt) => (
                <div 
                  key={receipt.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => receipt.receipt_photo_url && window.open(receipt.receipt_photo_url, '_blank')}
                >
                  {receipt.receipt_photo_url && (
                    <img
                      src={receipt.receipt_photo_url}
                      alt="Bonnetje"
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                  )}
                  <div className="space-y-1">
                    {receipt.supplier && (
                      <p className="text-sm font-medium">{receipt.supplier}</p>
                    )}
                    {receipt.total_amount && (
                      <p className="text-lg font-bold text-emerald-600">
                        € {receipt.total_amount.toFixed(2)}
                      </p>
                    )}
                    {receipt.description && (
                      <p className="text-xs text-muted-foreground">{receipt.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {receipt.category || 'Overig'}
                    </p>
                  </div>
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

          {/* Installer Signature */}
          {completionData?.installer_signature && (
            <Card className="p-4">
              <h4 className="font-medium text-sm mb-3 text-muted-foreground">Handtekening Monteur</h4>
              <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50">
                <img
                  src={completionData.installer_signature}
                  alt="Monteur handtekening"
                  className="max-h-32 mx-auto"
                />
              </div>
              <p className="text-sm text-center mt-2 text-muted-foreground">
                {installerProfile?.full_name || 'Monteur'}
              </p>
            </Card>
          )}
        </div>

        {/* PDF Download */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-800">Acties</h3>
              <p className="text-sm text-blue-600">Download de werkbon of verstuur per e-mail.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              disabled={isGeneratingPdf || isSendingEmail}
              onClick={async (e) => {
                e.preventDefault();
                setIsGeneratingPdf(true);
                try {
                  const { data, error } = await supabase.functions.invoke('generate-pdf-simple', {
                    body: { completionId: completionData.id }
                  });
                  if (error) throw new Error("PDF generatie mislukt.");

                  if (data.pdfUrl) {
                    // Fetch the PDF as a blob
                    const response = await fetch(data.pdfUrl);
                    if (!response.ok) throw new Error("PDF ophalen mislukt.");
                    const blob = await response.blob();

                    // Create a link and trigger download
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `Werkbon-${workOrder.work_order_number}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                  }
                } catch (err: any) {
                  console.error("Failed to download PDF:", err);
                  toast({
                    title: "Fout bij downloaden",
                    description: err.message || "De PDF kon niet worden gedownload.",
                    variant: "destructive",
                  });
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <FileText className="h-4 w-4" />
              {isGeneratingPdf ? 'Genereren...' : 'Download PDF'}
            </button>

            <button
              disabled={isSendingEmail || isGeneratingPdf}
              onClick={async (e) => {
                e.preventDefault();
                setIsSendingEmail(true);
                try {
                  const { error } = await supabase.functions.invoke('send-workorder-email', {
                    body: { 
                      completionId: completionData.id,
                      customerEmail: workOrder.project?.customer?.email 
                    }
                  });
                  if (error) throw new Error("E-mail versturen is mislukt.");
                  toast({
                    title: "E-mail verzonden",
                    description: `De werkbon is succesvol naar ${workOrder.project?.customer?.email || 'de klant'} gestuurd.`,
                  });
                } catch (err: any) {
                  console.error("Failed to send email:", err);
                  toast({
                    title: "Fout bij verzenden",
                    description: err.message || "De e-mail kon niet worden verstuurd.",
                    variant: "destructive",
                  });
                } finally {
                  setIsSendingEmail(false);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <Mail className="h-4 w-4" />
              {isSendingEmail ? 'Versturen...' : 'Verstuur E-mail'}
            </button>
          </div>
        </Card>

      </div>
    </SlidePanel>
  );
};

