import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Eye, Mail, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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
      const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-pdf-simple', {
        body: { completionId: workOrderData.completion_id }
      })

      if (pdfError) throw pdfError

      setHtmlContent(pdfData.html)
    } catch (err) {
      console.error('Error loading work order:', err)
      setError('Kon werkbon niet laden')
      toast({
        title: "Fout",
        description: "Kon werkbon niet laden",
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
