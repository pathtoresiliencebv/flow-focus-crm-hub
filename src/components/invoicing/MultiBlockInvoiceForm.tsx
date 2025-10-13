import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, GripVertical, Trash2, Save, Eye, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCrmStore } from '@/hooks/useCrmStore';
import { MultiBlockInvoicePreview } from './MultiBlockInvoicePreview';
import { InvoiceBlockForm } from './InvoiceBlockForm';
import { PaymentTermsSelector, PaymentTerm } from '../quotes/PaymentTermsSelector';
import { supabase } from '@/integrations/supabase/client';
import { generateUUID } from '@/utils/uuid';
import { SearchableCustomerSelect } from '@/components/ui/searchable-customer-select';

interface InvoiceItem {
  id: string;
  type: 'product' | 'textblock';
  description: string;
  quantity?: number;
  unit_price?: number;
  vat_rate: number;
  total?: number;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

interface InvoiceBlock {
  id: string;
  title: string;
  type: 'product' | 'textblock';
  items: InvoiceItem[];
  subtotal: number;
  vat_amount: number;
  order_index: number;
  content?: string; // For text-only blocks
}

interface MultiBlockInvoiceFormProps {
  onClose?: () => void;
  invoiceId?: string;
}

export function MultiBlockInvoiceForm({ onClose, invoiceId }: MultiBlockInvoiceFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { customers, projects, isLoading: crmLoading } = useCrmStore();

  // ✅ ALL HOOKS FIRST - Before any early returns (React Rules of Hooks)
  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [message, setMessage] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [blocks, setBlocks] = useState<InvoiceBlock[]>([]);
  
  // UI state
  const [previewKey, setPreviewKey] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Auto-save timer
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // ✅ FIX: Declare ALL functions BEFORE useEffect to prevent TDZ error
  const calculateBlockTotals = (block: InvoiceBlock) => {
    const productItems = block.items.filter(item => item.type === 'product');
    block.subtotal = productItems.reduce((sum, item) => sum + (item.total || 0), 0);
    block.vat_amount = productItems.reduce((sum, item) => {
      const itemTotal = item.total || 0;
      const vatRate = item.vat_rate || 0;
      return sum + (itemTotal * vatRate / 100);
    }, 0);
  };

  const calculateTotals = () => {
    const totalAmount = blocks.reduce((sum, block) => sum + block.subtotal, 0);
    const totalVAT = blocks.reduce((sum, block) => sum + block.vat_amount, 0);
    return { totalAmount, totalVAT };
  };

  const generateInvoiceNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_invoice_number');
      if (error) throw error;
      setInvoiceNumber(data);
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const loadInvoice = async (id: string) => {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Set basic invoice data
      setInvoiceNumber(invoice.invoice_number);
      setInvoiceDate(invoice.invoice_date);
      setDueDate(invoice.due_date);
      setMessage(invoice.message || '');
      
      // Find customer and project
      const customer = customers.find(c => c.name === invoice.customer_name);
      if (customer) setSelectedCustomerId(customer.id);
      
      const project = projects.find(p => p.title === invoice.project_title);
      if (project) setSelectedProjectId(project.id);

      // Convert invoice items back to blocks
      const blockMap = new Map<string, InvoiceBlock>();
      
      invoice.invoice_items
        .sort((a, b) => a.order_index - b.order_index)
        .forEach(item => {
          const blockTitle = item.block_title || 'Items';
          
          if (!blockMap.has(blockTitle)) {
            blockMap.set(blockTitle, {
              id: generateUUID(),
              title: blockTitle,
              type: item.type === 'block_header' ? 'product' : 'product',
              items: [],
              subtotal: 0,
              vat_amount: 0,
              order_index: item.block_order || 0
            });
          }
          
          const block = blockMap.get(blockTitle)!;
          
          if (item.type !== 'block_header' && item.type !== 'block_subtotal') {
            block.items.push({
              id: item.id,
              type: item.type as 'product' | 'textblock',
              description: item.description,
              quantity: item.quantity || undefined,
              unit_price: Number(item.unit_price) || undefined,
              vat_rate: item.vat_rate,
              total: Number(item.total) || undefined,
              formatting: item.item_formatting as any
            });
          }
        });
      
      const loadedBlocks = Array.from(blockMap.values())
        .sort((a, b) => a.order_index - b.order_index);
      
      // Recalculate totals
      loadedBlocks.forEach(calculateBlockTotals);
      setBlocks(loadedBlocks);
      
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast({
        title: "Fout bij laden",
        description: "Factuur kon niet worden geladen.",
        variant: "destructive",
      });
    }
  };

  const addBlock = (type: 'product' | 'textblock') => {
    const newBlock: InvoiceBlock = {
      id: generateUUID(),
      title: type === 'product' ? `Productblok ${blocks.filter(b => b.type === 'product').length + 1}` : `Tekstblok ${blocks.filter(b => b.type === 'textblock').length + 1}`,
      type,
      items: [],
      subtotal: 0,
      vat_amount: 0,
      order_index: blocks.length,
      content: type === 'textblock' ? '' : undefined
    };

    if (type === 'product') {
      newBlock.items = [{
        id: generateUUID(),
        type: 'product',
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: 21,
        total: 0
      }];
    }

    setBlocks([...blocks, newBlock]);
    setUpdateCounter(prev => prev + 1);
  };

  const triggerAutoSave = () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(() => {
      if (selectedCustomerId && blocks.length > 0) {
        handleAutoSave();
      }
    }, 2000) as ReturnType<typeof setTimeout>;
  };

  const handleAutoSave = async () => {
    if (!selectedCustomerId || !invoiceNumber) return;
    
    setAutoSaveStatus('saving');
    try {
      await saveInvoice(true);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      setAutoSaveStatus('idle');
      console.error('Auto-save failed:', error);
    }
  };

  // ✅ useEffect hooks - NOW all functions are declared before
  useEffect(() => {
    generateInvoiceNumber();
    if (invoiceId) {
      loadInvoice(invoiceId);
    } else {
      addBlock('product');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  useEffect(() => {
    setPreviewKey(prev => prev + 1);
    triggerAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId, selectedProjectId, invoiceNumber, invoiceDate, dueDate, message, blocks]);

  // ✅ Loading check AFTER all hooks (including useEffect)
  if (crmLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Klantgegevens laden...</p>
        </div>
      </div>
    );
  }


  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
    setUpdateCounter(prev => prev + 1);
  };

  const updateBlock = (blockId: string, updates: Partial<InvoiceBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
    setUpdateCounter(prev => prev + 1);
  };

  const addItemToBlock = (blockId: string, type: 'product' | 'textblock') => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        const newItem: InvoiceItem = {
          id: generateUUID(),
          type,
          description: '',
          vat_rate: type === 'product' ? 21 : 0,
          ...(type === 'product' && { quantity: 1, unit_price: 0, total: 0 })
        };
        return { ...block, items: [...block.items, newItem] };
      }
      return block;
    }));
    setUpdateCounter(prev => prev + 1);
  };

  const removeItemFromBlock = (blockId: string, itemId: string) => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, items: block.items.filter(item => item.id !== itemId) };
      }
      return block;
    }));
    setUpdateCounter(prev => prev + 1);
  };

  const updateItem = (blockId: string, itemId: string, updates: Partial<InvoiceItem>) => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        const updatedItems = block.items.map(item => {
          if (item.id === itemId) {
            const updatedItem = { ...item, ...updates };
            if (updatedItem.type === 'product' && updatedItem.quantity && updatedItem.unit_price) {
              updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
            }
            return updatedItem;
          }
          return item;
        });
        const updatedBlock = { ...block, items: updatedItems };
        calculateBlockTotals(updatedBlock);
        return updatedBlock;
      }
      return block;
    }));
    setUpdateCounter(prev => prev + 1);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const newBlocks = Array.from(blocks);
    const [reorderedBlock] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, reorderedBlock);

    setBlocks(newBlocks.map((block, index) => ({ ...block, order_index: index })));
    setUpdateCounter(prev => prev + 1);
  };

  const saveInvoice = async (isAutoSave = false) => {
    if (!selectedCustomerId) {
      if (!isAutoSave) {
        toast({
          title: "Selecteer een klant",
          description: "Een klant is verplicht voor het opslaan van de factuur.",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      const project = projects.find(p => p.id === selectedProjectId);
      const { totalAmount, totalVAT } = calculateTotals();

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_name: customer?.name || '',
        customer_email: customer?.email || '',
        project_title: project?.title || '',
        invoice_date: invoiceDate,
        due_date: dueDate,
        message: message,
        subtotal: totalAmount,
        vat_amount: totalVAT,
        total_amount: totalAmount + totalVAT,
        status: 'concept',
        ...(isAutoSave && { auto_saved_at: new Date().toISOString() })
      };

      return await saveInvoiceData(invoiceData);
    } catch (error) {
      console.error('Error saving invoice:', error);
      if (!isAutoSave) {
        toast({
          title: "Fout bij opslaan",
          description: "Er is een fout opgetreden bij het opslaan van de factuur.",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const saveAndPrepareToSend = async () => {
    if (!selectedCustomerId) {
      toast({
        title: "Selecteer een klant",
        description: "Een klant is verplicht voor het versturen van de factuur.",
        variant: "destructive",
      });
      return;
    }

    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      const project = projects.find(p => p.id === selectedProjectId);
      const { totalAmount, totalVAT } = calculateTotals();

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_name: customer?.name || '',
        customer_email: customer?.email || '',
        project_title: project?.title || '',
        invoice_date: invoiceDate,
        due_date: dueDate,
        message: message,
        subtotal: totalAmount,
        vat_amount: totalVAT,
        total_amount: totalAmount + totalVAT,
        status: 'te-versturen'
      };

      const savedInvoiceId = await saveInvoiceData(invoiceData);
      
      toast({
        title: "Factuur opgeslagen",
        description: "Factuur is succesvol opgeslagen en klaar om te versturen.",
      });
      
      // ✅ FIX: Close dialog instead of navigate to prevent auth loop
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error('Error preparing invoice for send:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het voorbereiden van de factuur.",
        variant: "destructive",
      });
    }
  };

  const saveInvoiceData = async (invoiceData: any) => {

    let savedInvoiceId = invoiceId;

    if (invoiceId) {
      // Update existing invoice
      const { error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', invoiceId);

      if (error) throw error;

      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);
    } else {
      // Create new invoice
      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select('id')
        .single();

      if (error) throw error;
      savedInvoiceId = invoice.id;
    }

    // Insert invoice items
    const invoiceItemInserts = [];
    let orderIndex = 0;

    for (const block of blocks) {
      // Add block header
      invoiceItemInserts.push({
        invoice_id: savedInvoiceId,
        type: 'block_header',
        description: `=== ${block.title} ===`,
        quantity: 1,
        unit_price: 0,
        vat_rate: 0,
        total: 0,
        order_index: orderIndex++,
        block_title: block.title,
        block_order: orderIndex
      });

      // Add block items
      for (const item of block.items) {
        invoiceItemInserts.push({
          invoice_id: savedInvoiceId,
          type: item.type,
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          vat_rate: item.vat_rate || 0,
          total: item.total || 0,
          order_index: orderIndex++,
          item_formatting: item.formatting,
          block_title: block.title,
          block_order: orderIndex
        });
      }
    }

    if (invoiceItemInserts.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItemInserts);

      if (itemsError) throw itemsError;
    }

    toast({
      title: "Factuur opgeslagen",
      description: `Factuur ${invoiceNumber} is succesvol opgeslagen.`,
    });

    return savedInvoiceId;
  };


  const { totalAmount, totalVAT } = calculateTotals();

  // Create invoice object for preview
  const invoiceForPreview = {
    id: invoiceId || '',
    invoice_number: invoiceNumber,
    customer_name: customers.find(c => c.id === selectedCustomerId)?.name || '',
    customer_email: customers.find(c => c.id === selectedCustomerId)?.email || '',
    project_title: projects.find(p => p.id === selectedProjectId)?.title || '',
    invoice_date: invoiceDate,
    due_date: dueDate,
    message: message,
    payment_terms: paymentTerms,
    blocks: blocks,
    // Convert blocks to invoice_items for preview
    invoice_items: blocks.flatMap(block => 
      block.items.map(item => ({
        id: item.id,
        type: item.type,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        vat_rate: item.vat_rate || 0,
        total: item.total || 0,
        formatting: item.formatting
      }))
    ),
    total_amount: totalAmount,
    total_vat_amount: totalVAT,
    status: 'concept'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
      {/* Left side - Form */}
      <div className="lg:col-span-2 space-y-4 pr-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Nieuwe factuur - Meerdere blokken</h3>
          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
            autoSaveStatus === 'saving' ? 'bg-yellow-100 text-yellow-800' : 
            autoSaveStatus === 'saved' ? 'bg-green-100 text-green-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {autoSaveStatus === 'saving' && (
              <>
                <Clock className="inline h-3 w-3 mr-1" />
                Bezig met opslaan...
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <Save className="inline h-3 w-3 mr-1" />
                Automatisch opgeslagen
              </>
            )}
            {autoSaveStatus === 'idle' && 'Concept'}
          </div>
        </div>

        {/* Basic Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Klant *</label>
            <SearchableCustomerSelect
              customers={customers}
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
              placeholder="Zoek op naam, email of telefoon..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={!selectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer project" />
              </SelectTrigger>
              <SelectContent>
                {projects
                  .filter(project => selectedCustomerId && project.customer_id === selectedCustomerId)
                  .map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Factuurnummer</label>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Factuurdatum</label>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vervaldatum</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bericht (optioneel)</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Extra bericht voor deze factuur"
            rows={3}
          />
        </div>

        {/* Payment Terms */}
        <div>
          <label className="block text-sm font-medium mb-2">Betalingstermijnen</label>
          <PaymentTermsSelector 
            value={paymentTerms} 
            onChange={setPaymentTerms} 
          />
        </div>

        {/* Blocks Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium">Factuurblokken</h4>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock('product')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Product Blok
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock('textblock')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tekst Blok
              </Button>
            </div>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="blocks">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {blocks.map((block, index) => (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                       {(provided) => (
                         <div ref={provided.innerRef} {...provided.draggableProps}>
                           <InvoiceBlockForm
                             block={block}
                             onUpdateBlock={(updatedBlock) => {
                               setBlocks(blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b));
                               setUpdateCounter(prev => prev + 1);
                             }}
                             onDeleteBlock={() => removeBlock(block.id)}
                             canDelete={blocks.length > 1}
                             dragHandleProps={provided.dragHandleProps}
                           />
                         </div>
                       )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Grand Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Totaal excl. BTW:</span>
                <span className="font-medium">€{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Totaal BTW:</span>
                <span className="font-medium">€{totalVAT.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Eindtotaal:</span>
                <span>€{(totalAmount + totalVAT).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar overzicht
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (invoiceId) {
                  try {
                    console.log('📄 Generating PDF for invoice:', invoiceId);
                    const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
                      body: { invoiceId }
                    });

                    if (error) {
                      console.error('❌ PDF Generation Error:', error);
                      toast({
                        title: "PDF Fout",
                        description: `Kon PDF niet genereren: ${error.message}`,
                        variant: "destructive",
                      });
                      return;
                    }

                    if (data?.success && data?.htmlContent) {
                      // Open PDF in new window for printing
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(data.htmlContent);
                        printWindow.document.close();
                        printWindow.focus();
                        
                        // Wait for content to load, then trigger print
                        setTimeout(() => {
                          printWindow.print();
                        }, 1000);
                      }
                      
                      toast({
                        title: "PDF geopend",
                        description: "Het PDF bestand is geopend voor afdrukken.",
                      });
                    } else {
                      console.error('❌ No HTML content in response:', data);
                      toast({
                        title: "PDF Fout",
                        description: "Geen PDF content ontvangen van server.",
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    console.error('❌ Error generating PDF:', error);
                    toast({
                      title: "PDF Fout",
                      description: "Er is een onverwachte fout opgetreden bij het genereren van de PDF.",
                      variant: "destructive",
                    });
                  }
                } else {
                  toast({
                    title: "Factuur niet opgeslagen",
                    description: "Sla eerst de factuur op voordat je een PDF genereert.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!invoiceId}
            >
              <Eye className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  await saveInvoice(false);
                  toast({
                    title: "Concept opgeslagen",
                    description: "Je factuur is opgeslagen als concept.",
                  });
                  // ✅ FIX: Close dialog instead of navigate to prevent auth loop
                  if (onClose) {
                    onClose();
                  }
                } catch (error) {
                  toast({
                    title: "Fout bij opslaan",
                    description: "Er is een fout opgetreden bij het opslaan van het concept.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!selectedCustomerId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Opslaan
            </Button>
          </div>

          {/* Herinneringsschema onderaan - Prominenter en duidelijker */}
          {selectedCustomerId && dueDate && (
            <div className="mt-8 p-6 bg-white border-2 border-amber-400 rounded-xl shadow-lg">
              <h4 className="font-bold text-xl text-amber-900 mb-5 flex items-center gap-3">
                <span className="text-3xl">⏰</span>
                Automatische Betalingsherinneringen
              </h4>
              <div className="space-y-4">
                {[1, 2, 3].map((num) => {
                  const due = new Date(dueDate);
                  const reminderDate = new Date(due);
                  reminderDate.setDate(due.getDate() + (num * 14));
                  
                  return (
                    <div key={num} className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:border-amber-400 transition-all">
                      <span className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                        {num}
                      </span>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-800 text-base block">
                          {num === 1 ? '1e' : num === 2 ? '2e' : '3e'} herinnering
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-amber-900 text-lg">
                            {reminderDate.toLocaleDateString('nl-NL', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span className="text-sm text-gray-600">
                            ({14 * num} dagen na vervaldatum)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-amber-800 mt-5 italic flex items-center gap-2 bg-amber-100 p-3 rounded-lg">
                <span className="text-lg">💡</span>
                <span className="font-medium">Herinneringen worden automatisch verstuurd als de factuur niet is betaald</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Preview */}
      <div className="lg:col-span-3">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-3 w-3" />
          <h4 className="text-xs font-medium text-gray-600">Preview</h4>
        </div>
        <MultiBlockInvoicePreview key={previewKey} invoice={invoiceForPreview} />
      </div>
    </div>
  );
}