import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Eye, Mail, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

function generateBasicWorkOrderHTML(workOrder: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Werkbon - ${workOrder.work_order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #d32f2f; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #d32f2f; font-size: 28px; margin-bottom: 10px; }
    .header .company { font-size: 16px; color: #666; }
    .info-section { margin-bottom: 25px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-box { background: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; }
    .info-box h3 { color: #d32f2f; margin-bottom: 10px; font-size: 14px; }
    .section-title { background: #d32f2f; color: white; padding: 8px 15px; font-size: 14px; font-weight: bold; margin-bottom: 15px; }
    .work-summary { background: #f9f9f9; padding: 15px; margin-bottom: 20px; border: 1px solid #ddd; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
    .signature-box { border: 1px solid #ddd; padding: 15px; text-align: center; }
    .signature-box h4 { margin-bottom: 10px; color: #d32f2f; }
    .summary-box { background: #e8f5e8; padding: 15px; border: 1px solid #4caf50; margin-top: 20px; }
    .summary-box h3 { color: #2e7d32; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SMANS ONDERHOUD</h1>
    <div class="company">Onderhoud en Service J.J.P. Smans</div>
    <div style="margin-top: 10px; font-size: 14px;">Werkbon</div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Project Informatie</h3>
      <p><strong>Werkbon:</strong> ${workOrder.work_order_number}</p>
      <p><strong>Datum:</strong> ${workOrder.signed_at ? new Date(workOrder.signed_at).toLocaleDateString('nl-NL') : 'N/A'}</p>
      <p><strong>Status:</strong> Afgerond</p>
    </div>
    <div class="info-box">
      <h3>Klant Informatie</h3>
      <p><strong>Naam:</strong> ${workOrder.client_name || 'N/A'}</p>
      <p><strong>Project:</strong> ${workOrder.project?.title || 'N/A'}</p>
    </div>
  </div>

  <div class="section-title">Werk Samenvatting</div>
  <div class="work-summary">
    <p><strong>Werkzaamheden:</strong></p>
    <p>${workOrder.summary_text || 'Geen details beschikbaar'}</p>
  </div>

  <div class="signatures">
    <div class="signature-box">
      <h4>Handtekening Klant</h4>
      <p><strong>Naam:</strong> ${workOrder.client_name || 'N/A'}</p>
      <p><strong>Datum:</strong> ${workOrder.signed_at ? new Date(workOrder.signed_at).toLocaleDateString('nl-NL') : 'N/A'}</p>
      ${workOrder.client_signature_data ? `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9;">
        <img src="${workOrder.client_signature_data}" alt="Klant handtekening" style="max-width: 200px; max-height: 100px; display: block; margin: 0 auto;" />
      </div>
      ` : '<p style="color: #999; text-align: center; padding: 20px; border: 1px dashed #ccc;">Geen handtekening beschikbaar</p>'}
    </div>
    
    <div class="signature-box">
      <h4>Handtekening Monteur</h4>
      <p><strong>Naam:</strong> N/A</p>
      <p><strong>Datum:</strong> ${workOrder.signed_at ? new Date(workOrder.signed_at).toLocaleDateString('nl-NL') : 'N/A'}</p>
      ${workOrder.monteur_signature_data ? `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9;">
        <img src="${workOrder.monteur_signature_data}" alt="Monteur handtekening" style="max-width: 200px; max-height: 100px; display: block; margin: 0 auto;" />
      </div>
      ` : '<p style="color: #999; text-align: center; padding: 20px; border: 1px dashed #ccc;">Geen handtekening beschikbaar</p>'}
    </div>
  </div>

  <div class="summary-box">
    <h3>Samenvatting</h3>
    <p><strong>Werkbon Nummer:</strong> ${workOrder.work_order_number}</p>
    <p><strong>Ondertekend op:</strong> ${workOrder.signed_at ? new Date(workOrder.signed_at).toLocaleDateString('nl-NL') : 'N/A'}</p>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #666; font-size: 10px;">
    <p>Dit werkbon is gegenereerd door het SMANS CRM systeem</p>
    <p>Datum: ${new Date().toLocaleDateString('nl-NL')} - Werkbon ID: ${workOrder.id.slice(0, 8).toUpperCase()}</p>
  </div>
</body>
</html>
  `.trim()
}

export default function WorkOrderViewer() {
  const { projectId, workOrderId } = useParams<{ projectId: string; workOrderId: string }>()
  const navigate = useNavigate()
  const [workOrder, setWorkOrder] = useState<any>(null)
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    loadWorkOrder()
  }, [workOrderId])

  const loadWorkOrder = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Fetch work order data
      const { data: workOrderData, error: workOrderError } = await supabase
        .from('project_work_orders')
        .select(`
          *,
          project:projects(*, customer:customers(*))
        `)
        .eq('id', workOrderId)
        .single()

      if (workOrderError) throw workOrderError

      setWorkOrder(workOrderData)

      // Generate PDF content
      if (workOrderData.completion_id) {
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-pdf-simple', {
          body: { completionId: workOrderData.completion_id }
        })

        if (pdfError) {
          console.error('PDF generation error:', pdfError)
          // Continue without PDF content
        } else {
          setHtmlContent(pdfData.html)
        }
      } else {
        console.warn('No completion_id found for work order')
        // Generate basic HTML without completion data
        const basicHtml = generateBasicWorkOrderHTML(workOrderData)
        setHtmlContent(basicHtml)
      }
    } catch (err: any) {
      console.error('Error loading work order:', err)
      const errorMessage = err?.message || 'Kon werkbon niet laden'
      setError(errorMessage)
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = async () => {
    try {
      if (!htmlContent) return

      // Try to get PDF URL from the response
      const { data, error } = await supabase.functions.invoke('generate-pdf-simple', {
        body: { completionId: workOrder?.completion_id }
      })

      if (error) throw error

      if (data.pdfUrl && data.pdfUrl.startsWith('http')) {
        // Download actual PDF from URL
        const link = document.createElement('a')
        link.href = data.pdfUrl
        link.download = `werkbon-${workOrder?.work_order_number || 'onbekend'}-${new Date().toISOString().split('T')[0]}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "PDF Gedownload",
          description: "Werkbon PDF is succesvol gedownload",
        })
      } else {
        // Fallback to HTML download
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `werkbon-${workOrder?.work_order_number || 'onbekend'}-${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
          title: "HTML Gedownload",
          description: "Werkbon wordt gedownload als HTML bestand (kan worden geprint naar PDF)",
        })
      }
    } catch (err) {
      console.error('Error downloading PDF:', err)
      toast({
        title: "Fout",
        description: "Kon PDF niet downloaden",
        variant: "destructive"
      })
    }
  }

  const sendEmail = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-workorder-email', {
        body: { 
          completionId: workOrder?.completion_id,
          customerEmail: workOrder?.project?.customer?.email
        }
      })

      if (error) throw error

      toast({
        title: "Email Verzonden",
        description: "Werkbon is per email verzonden naar de klant",
      })
    } catch (err) {
      console.error('Error sending email:', err)
      toast({
        title: "Fout",
        description: "Kon email niet verzenden",
        variant: "destructive"
      })
    }
  }

  const printPDF = () => {
    if (!htmlContent) return

    // Create a new window with the HTML content
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

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
              <Button onClick={loadWorkOrder} className="mt-4">
                Opnieuw Proberen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
          <div>
            <h1 className="text-2xl font-bold">Werkbon - {workOrder.work_order_number}</h1>
            <p className="text-muted-foreground">
              Project: {workOrder.project?.title} | 
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
                <Button onClick={downloadPDF} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={printPDF} variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={sendEmail} variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <iframe
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
