import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Eye, Mail, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PDFViewerProps {
  completionId: string
  projectTitle: string
  onClose?: () => void
}

export function PDFViewer({ completionId, projectTitle, onClose }: PDFViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    loadPDFContent()
  }, [completionId])

  const loadPDFContent = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const { data, error } = await supabase.functions.invoke('generate-pdf-simple', {
        body: { completionId }
      })

      if (error) throw error

      setHtmlContent(data.html)
    } catch (err) {
      console.error('Error loading PDF content:', err)
      setError('Kon PDF niet laden')
      toast({
        title: "Fout",
        description: "Kon werkbon PDF niet laden",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!htmlContent) return

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    // Create download link
    const link = document.createElement('a')
    link.href = url
    link.download = `werkbon-${projectTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Download Gestart",
      description: "Werkbon wordt gedownload als HTML bestand",
    })
  }

  const sendEmail = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('send-workorder-email', {
        body: { completionId }
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
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Werkbon Laden...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <X className="h-5 w-5" />
            Fout bij Laden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button onClick={loadPDFContent} className="mt-4">
            Opnieuw Proberen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Werkbon - {projectTitle}
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={downloadPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={printPDF} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={sendEmail} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            )}
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
  )
}
