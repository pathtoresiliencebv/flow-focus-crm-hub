
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PlusCircle, Trash2, Receipt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { InvoicePreview } from "./InvoicePreview";
import { CustomerQuickAdd } from "./CustomerQuickAdd";
import { useCrmStore } from "@/hooks/useCrmStore";

interface InvoiceFormProps {
  onClose?: () => void;
  customers: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; title: string; value: string; customer: string }>;
}

interface InvoiceFormValues {
  customer: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  project?: string;
  message?: string;
  items: Array<{ id: string; description: string; quantity: number; price: number; vatRate: number; total: number }>;
}

export function InvoiceForm({ onClose, customers, projects }: InvoiceFormProps) {
  const { toast } = useToast();
  const { customers: allCustomers, projects: allProjects, addProject } = useCrmStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showCustomerAdd, setShowCustomerAdd] = useState(false);
  const [showProjectAdd, setShowProjectAdd] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ title: "", description: "" });
  
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      message: "",
      items: [
        { id: crypto.randomUUID(), description: "", quantity: 1, price: 0, vatRate: 21, total: 0 }
      ]
    }
  });

  // Watch all form values for real-time preview
  const watchedValues = form.watch();

  const addItem = () => {
    form.setValue('items', [
      ...form.getValues('items'),
      { id: crypto.randomUUID(), description: "", quantity: 1, price: 0, vatRate: 21, total: 0 }
    ]);
  };
  
  const removeItem = (index: number) => {
    const currentItems = form.getValues('items');
    if (currentItems.length > 1) {
      form.setValue('items', currentItems.filter((_, i) => i !== index));
    }
  };

  const calculateItemTotal = (index: number) => {
    const currentItems = form.getValues('items');
    const item = currentItems[index];
    const total = item.quantity * item.price;
    
    const updatedItems = [...currentItems];
    updatedItems[index] = { ...item, total };
    
    form.setValue('items', updatedItems);
  };

  const calculateInvoiceTotal = () => {
    return form.getValues('items').reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleCustomerAdded = (customerId: string) => {
    form.setValue('customer', customerId);
    setSelectedCustomerId(customerId);
    setShowCustomerAdd(false);
  };

  const handleProjectAdd = async () => {
    if (!selectedCustomerId || !newProjectData.title) return;
    
    try {
      const projectData = {
        title: newProjectData.title,
        customer_id: selectedCustomerId,
        description: newProjectData.description || null,
        status: "te-plannen" as const,
        date: null,
        value: null,
      };
      
      const newProject = await addProject(projectData);
      form.setValue('project', newProject.id);
      setShowProjectAdd(false);
      setNewProjectData({ title: "", description: "" });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Project kon niet worden toegevoegd.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: InvoiceFormValues) => {
    console.log("Invoice data:", data);
    
    const customer = allCustomers.find(c => c.id === data.customer) || customers.find(c => c.id === data.customer);
    
    toast({
      title: "Factuur aangemaakt",
      description: `Factuur ${data.invoiceNumber} is aangemaakt voor ${customer?.name}.`,
    });
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[80vh]">
      {/* Form Section */}
      <div className="overflow-y-auto pr-2">
        <h3 className="text-lg font-semibold mb-4">Factuurgegevens</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klant</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCustomerId(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecteer een klant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomerAdd(true)}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showCustomerAdd && (
                <CustomerQuickAdd
                  onCustomerAdded={handleCustomerAdded}
                  onCancel={() => setShowCustomerAdd(false)}
                />
              )}
              
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedCustomerId}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={selectedCustomerId ? "Selecteer een project" : "Selecteer eerst een klant"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allProjects
                            .filter(project => selectedCustomerId && project.customer_id === selectedCustomerId)
                            .map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProjectAdd(true)}
                        disabled={!selectedCustomerId}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showProjectAdd && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                  <h4 className="font-medium">Nieuw project toevoegen</h4>
                  <div className="space-y-2">
                    <Input
                      placeholder="Project titel"
                      value={newProjectData.title}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Project beschrijving (optioneel)"
                      value={newProjectData.description}
                      onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowProjectAdd(false);
                        setNewProjectData({ title: "", description: "" });
                      }}
                    >
                      Annuleren
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleProjectAdd}
                      disabled={!newProjectData.title}
                    >
                      Project toevoegen
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factuurnummer</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factuurdatum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vervaldatum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bericht (optioneel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      placeholder="Extra bericht voor deze factuur"
                      className="min-h-[80px]" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Factuurregels</h4>
              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 border-b">
                  <div className="col-span-4 font-medium text-sm">Omschrijving</div>
                  <div className="col-span-2 font-medium text-sm">Aantal</div>
                  <div className="col-span-2 font-medium text-sm">Prijs</div>
                  <div className="col-span-1 font-medium text-sm">BTW%</div>
                  <div className="col-span-2 font-medium text-sm">Totaal</div>
                  <div className="col-span-1"></div>
                </div>
                
                {form.watch('items').map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-3 border-b items-center">
                    <div className="col-span-4">
                      <Input 
                        placeholder="Omschrijving"
                        value={item.description}
                        onChange={(e) => {
                          const currentItems = [...form.getValues('items')];
                          currentItems[index].description = e.target.value;
                          form.setValue('items', currentItems);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const currentItems = [...form.getValues('items')];
                          currentItems[index].quantity = parseInt(e.target.value);
                          form.setValue('items', currentItems);
                          calculateItemTotal(index);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => {
                          const currentItems = [...form.getValues('items')];
                          currentItems[index].price = parseFloat(e.target.value);
                          form.setValue('items', currentItems);
                          calculateItemTotal(index);
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      <Select
                        value={item.vatRate.toString()}
                        onValueChange={(value) => {
                          const currentItems = [...form.getValues('items')];
                          currentItems[index].vatRate = parseInt(value);
                          form.setValue('items', currentItems);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="9">9%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input 
                        type="number"
                        readOnly
                        value={item.total || item.quantity * item.price}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={form.getValues('items').length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="p-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addItem}
                    className="flex items-center text-sm"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Regel toevoegen
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <div className="w-1/3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotaal:</span>
                    <span>€{calculateInvoiceTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>BTW (21%):</span>
                    <span>€{(calculateInvoiceTotal() * 0.21).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Totaal:</span>
                    <span>€{(calculateInvoiceTotal() * 1.21).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuleren
                </Button>
              )}
              <Button type="submit">
                <Receipt className="mr-2 h-4 w-4" />
                Factuur opslaan
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Preview Section */}
      <div className="overflow-y-auto pl-2">
        <h3 className="text-lg font-semibold mb-4">Factuur Preview</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <InvoicePreview 
            formData={watchedValues} 
            customers={allCustomers} 
            projects={allProjects.map(p => ({ ...p, value: p.value?.toString() || '0' }))}
          />
        </div>
      </div>
    </div>
  );
}
