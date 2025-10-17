import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ArrowLeft, Download, Eye, Mail, Printer } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

// Define interfaces for the data structures
interface Task {
  id: string;
  task_description: string;
  block_title: string;
}

interface Photo {
  id: string;
  photo_url: string;
  description?: string;
}

interface WorkOrderData {
  id: string;
  work_order_number: string;
  signed_at: string;
  project: {
    name: string;
    id: string;
    customer: {
      name: string;
    }
  };
  completion: {
    id: string;
    client_name: string;
    client_signature_timestamp: string;
    customer_signature?: string; // allow mapping
    client_signature?: string;   // legacy mapping
    installer_signature: string;
    work_performed: string;
    installer_id: string;
    created_at?: string;
    installer?: {
      full_name: string;
    }
  };
}

const generateWorkOrderHTML = (workOrder: WorkOrderData, tasks: Task[], photos: Photo[]): string => {
  if (!workOrder) return '<p>Werkbon data niet gevonden.</p>';

  const groupedTasks = tasks.reduce((acc, task) => {
    const block = task.block_title || 'Overige Taken';
    if (!acc[block]) {
      acc[block] = [];
    }
    acc[block].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const tasksHtml = Object.keys(groupedTasks).length > 0
    ? Object.entries(groupedTasks).map(([blockTitle, tasks]) => `
        <div style="margin-bottom: 15px; padding-left: 10px;">
          <h4 style="font-weight: bold; color: #333; font-size: 14px; margin-bottom: 5px;">${blockTitle}</h4>
          <ul style="list-style-type: none; padding-left: 15px; margin:0;">
            ${tasks.map(task => `
              <li style="display: flex; align-items: center; margin-bottom: 5px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>${task.task_description}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')
    : '<li>Geen specifieke taken geselecteerd.</li>';

  const photosHtml = photos.length > 0 ? `
    <div class="section">
      <div class="section-title">Bijgevoegde Foto's</div>
      <div class="photo-gallery">
        ${photos.map(photo => `
          <div class="photo-item">
            <img src="${photo.photo_url}" alt="${photo.description || 'Werkbon foto'}" />
            ${photo.description ? `<p>${photo.description}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>` : '';

  const projectName = (workOrder.project as any)?.name || (workOrder.project as any)?.title || 'N/A';
  const customer = (workOrder.project as any)?.customer || {};
  const customerName = customer?.name || (workOrder.completion as any)?.customer_name || 'N/A';
  const customerAddress = customer?.address || 'N/A';
  const customerCity = customer?.city || '';
  const customerPostcode = customer?.postcode || '';
  const customerPhone = customer?.phone || 'N/A';
  const customerEmail = customer?.email || 'N/A';
  const signedAt = workOrder.signed_at || (workOrder.completion as any)?.created_at || '';

  return `
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; margin: 0; padding: 20px; background-color: #f9fafb; }
          .container { max-width: 800px; margin: auto; background: white; border: 1px solid #e5e7eb; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          @media print {
            body { margin: 0; padding: 0; background: white; }
            .container { max-width: 100%; margin: 0; padding: 20px; border: none; border-radius: 0; box-shadow: none; }
          }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 20px; }
          .header img { max-width: 150px; }
          .header h1 { color: #ef4444; font-size: 28px; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; }
          .info-box h3 { margin: 0 0 10px; font-size: 16px; color: #111827; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; }
          .info-box p { margin: 4px 0; font-size: 14px; }
          .section-title { background-color: #ef4444; color: white; padding: 10px 15px; font-weight: bold; border-radius: 6px 6px 0 0; margin-top: 20px; font-size: 16px; }
          .section-content { border: 1px solid #e5e7eb; border-top: none; padding: 15px; border-radius: 0 0 6px 6px; }
          .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; margin-bottom: 30px; }
          .signature-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; text-align: center; }
          .signature-box h4 { margin: 0 0 10px; font-size: 15px; }
          .signature-box img { max-width: 100%; height: auto; border: 1px dashed #d1d5db; border-radius: 4px; margin-bottom: 10px; min-height: 100px; }
          .photo-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 15px; border: 1px solid #e5e7eb; border-top: none; }
          .photo-item img { width: 100%; height: 100px; object-fit: cover; border-radius: 4px; }
          .photo-item p { font-size: 12px; text-align: center; margin-top: 5px; }
          ul { margin: 0; padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://www.smanscrm.nl/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" alt="Logo Smans" />
            <h1>Werkbon</h1>
          </div>
          <div class="info-grid">
            <div class="info-box">
              <h3>Project Informatie</h3>
              <p><strong>Werkbon:</strong> ${workOrder.work_order_number || 'N/A'}</p>
              <p><strong>Datum:</strong> ${signedAt ? format(new Date(signedAt), 'dd-MM-yyyy HH:mm', { locale: nl }) : 'N/A'}</p>
              <p><strong>Status:</strong> Afgerond</p>
            </div>
            <div class="info-box">
              <h3>Klant Informatie</h3>
              <p><strong>Naam:</strong> ${customerName}</p>
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Adres:</strong> ${customerAddress}</p>
              ${customerPostcode || customerCity ? `<p><strong>Postcode/Plaats:</strong> ${customerPostcode} ${customerCity}</p>` : ''}
              <p><strong>Telefoon:</strong> ${customerPhone}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
            </div>
          </div>
          
          <div class="section-title">Uitgevoerde Taken</div>
          <div class="section-content">
            ${tasksHtml}
          </div>

          <div class="signature-grid">
            <div class="signature-box">
              <h4>Handtekening Klant</h4>
              ${(workOrder.completion as any)?.customer_signature || workOrder.completion?.client_signature ? `<img src="${(workOrder.completion as any)?.customer_signature || workOrder.completion?.client_signature}" alt="Handtekening Klant"/>` : '<p>Geen handtekening beschikbaar</p>'}
              <p><strong>Naam:</strong> ${customerName}</p>
              <p><strong>Datum:</strong> ${signedAt ? format(new Date(signedAt), 'dd-MM-yyyy', { locale: nl }) : 'N/A'}</p>
            </div>
            <div class="signature-box">
              <h4>Handtekening Monteur</h4>
              ${workOrder.completion?.installer_signature ? `<img src="${workOrder.completion.installer_signature}" alt="Handtekening Monteur"/>` : '<p>Geen handtekening beschikbaar</p>'}
              <p><strong>Naam:</strong> ${workOrder.completion?.installer?.full_name || 'N/A'}</p>
              <p><strong>Datum:</strong> ${signedAt ? format(new Date(signedAt), 'dd-MM-yyyy', { locale: nl }) : 'N/A'}</p>
            </div>
          </div>
          
          <div class="section-title">Werk Samenvatting</div>
          <div class="section-content">
            <p>${workOrder.completion?.work_performed || (workOrder as any)?.summary_text || 'Geen samenvatting opgegeven.'}</p>
          </div>
          
          ${photos.length > 0 ? `
          <div class="section-title">Foto's</div>
          <div class="section-content">
            <div class="photo-gallery">
              ${photos.map(photo => `
                <div class="photo-item">
                  <img src="${photo.photo_url}" alt="${photo.description || 'Foto'}" />
                  ${photo.description ? `<p>${photo.description}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
};

export default function WorkOrderViewer() {
  const { projectId, workOrderId } = useParams<{ projectId: string; workOrderId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [workOrder, setWorkOrder] = useState<WorkOrderData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  const loadWorkOrderData = useCallback(async () => {
    if (!workOrderId) {
      setError('Werkbon ID niet gevonden.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // 1) Load plain work order first
      const { data: baseWO, error: woErr } = await supabase
        .from('project_work_orders')
        .select('*')
        .eq('id', workOrderId)
        .single();
      if (woErr) throw new Error(`Fout bij laden werkbon: ${woErr.message}`);
      if (!baseWO) throw new Error('Werkbon niet gevonden.');

      // 2) Load project + customer
      const { data: projectData, error: projErr } = await supabase
        .from('projects')
        .select('*, customer:customers(*)')
        .eq('id', baseWO.project_id)
        .single();
      if (projErr) throw new Error(`Fout bij laden project: ${projErr.message}`);

      // 3) Load completion if available
      let completionData: any = null;
      if (baseWO.completion_id) {
        const { data: comp, error: compErr } = await supabase
          .from('project_completions')
          .select('*')
          .eq('id', baseWO.completion_id)
          .single();
        if (!compErr) completionData = comp;
      }

      // Fallback: latest completion for this project if none linked
      if (!completionData) {
        const { data: latestComp } = await supabase
          .from('project_completions')
          .select('*')
          .eq('project_id', baseWO.project_id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (latestComp && latestComp.length > 0) {
          completionData = latestComp[0];
        }
      }

      // 3b) Installer profile
      let installerProfile: any = null;
      if (completionData?.installer_id) {
        const { data: installer, error: profErr } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', completionData.installer_id)
          .single();
        if (!profErr) installerProfile = installer;
      }

      const signedAt = baseWO.signed_at || completionData?.created_at || '';

      const finalWO: WorkOrderData = {
        id: baseWO.id,
        work_order_number: baseWO.work_order_number,
        signed_at: signedAt,
        project: { id: projectData.id, name: projectData.name || projectData.title, customer: { name: projectData.customer?.name || '' } },
        completion: {
          id: completionData?.id || '',
          client_name: completionData?.customer_name || completionData?.client_name || '',
          client_signature_timestamp: completionData?.created_at || '',
          customer_signature: completionData?.customer_signature,
          client_signature: completionData?.client_signature,
          installer_signature: completionData?.installer_signature || '',
          work_performed: completionData?.work_performed || '',
          installer_id: completionData?.installer_id || '',
          created_at: completionData?.created_at || '',
          installer: installerProfile || undefined,
        }
      } as WorkOrderData;

      setWorkOrder(finalWO);

      // 4) Fetch tasks associated with this work order
      const { data: taskData, error: taskError } = await supabase
        .from('project_tasks')
        .select('id, task_description, block_title')
        .eq('work_order_id', workOrderId);
      if (taskError) throw new Error(`Fout bij laden taken: ${taskError.message}`);
      setTasks(taskData || []);

      // 5) Fetch photos: completion_photos + project_photos for this work order
      let combinedPhotos: Photo[] = [];
      if (completionData?.id) {
        const { data: cPhotos } = await supabase
          .from('completion_photos')
          .select('id, photo_url, description')
          .eq('completion_id', completionData.id);
        combinedPhotos = combinedPhotos.concat((cPhotos as any) || []);
      }
      const { data: pPhotos } = await supabase
        .from('project_photos')
        .select('id, photo_url, description')
        .eq('work_order_id', workOrderId);
      combinedPhotos = combinedPhotos.concat((pPhotos as any) || []);
      setPhotos(combinedPhotos);

    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Fout bij laden',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [workOrderId, toast]);

  useEffect(() => {
    loadWorkOrderData();
  }, [loadWorkOrderData]);

  useEffect(() => {
    if (workOrder && tasks) {
      const newHtml = generateWorkOrderHTML(workOrder, tasks, photos);
      setHtmlContent(newHtml);
    }
  }, [workOrder, tasks, photos]);

  const handlePrint = () => {
    const iframe = document.getElementById('work-order-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };
  
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/project/${projectId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Button>
            <div className="animate-pulse h-8 w-64 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Button>
            <h1 className="text-2xl font-bold text-red-600">Fout bij Laden</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadWorkOrderData} className="mt-4">
                Opnieuw Proberen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Robust back navigation
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(projectId ? `/project/${projectId}` : '/projects');
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Werkbon - {workOrder.work_order_number}</h1>
            <p className="text-muted-foreground">
              Project: {workOrder.project?.name} | 
              Klant: {workOrder.project?.customer?.name}
            </p>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Werkbon - {workOrder.work_order_number}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => {
                  const iframe = document.getElementById('work-order-iframe') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.print();
                  }
                }} variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => {
                  const iframe = document.getElementById('work-order-iframe') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.print();
                  }
                }} variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => {
                  const iframe = document.getElementById('work-order-iframe') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.print();
                  }
                }} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                id="work-order-iframe"
                srcDoc={htmlContent}
                className="w-full h-[800px] border-0"
                title="Werkbon PDF"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
