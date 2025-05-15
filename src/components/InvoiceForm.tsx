
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PlusCircle, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface InvoiceFormProps {
  onClose?: () => void;
  customers: Array<{ id: number; name: string }>;
  projects?: Array<{ id: number; title: string; value: string }>;
}

interface InvoiceFormValues {
  customer: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  project?: string;
  items: Array<{ id: string; description: string; quantity: number; price: number; total: number }>;
}

export function InvoiceForm({ onClose, customers, projects }: InvoiceFormProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        { id: crypto.randomUUID(), description: "", quantity: 1, price: 0, total: 0 }
      ]
    }
  });

  const { fields: items, append, remove } = form.control._formValues.items;

  const addItem = () => {
    form.setValue('items', [
      ...form.getValues('items'),
      { id: crypto.randomUUID(), description: "", quantity: 1, price: 0, total: 0 }
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

  const onSubmit = (data: InvoiceFormValues) => {
    console.log("Invoice data:", data);
    
    toast({
      title: "Factuur aangemaakt",
      description: `Factuur ${data.invoiceNumber} is aangemaakt voor ${customers.find(c => c.id.toString() === data.customer)?.name}.`,
    });
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Klant</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedCustomerId(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een klant" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {projects && (
            <FormField
              control={form.control}
              name="project"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects
                        .filter(project => !selectedCustomerId || 
                          customers.find(c => c.id.toString() === selectedCustomerId)?.name === project.customer)
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Factuurregels</h3>
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 border-b">
              <div className="col-span-5 font-medium text-sm">Omschrijving</div>
              <div className="col-span-2 font-medium text-sm">Aantal</div>
              <div className="col-span-2 font-medium text-sm">Prijs</div>
              <div className="col-span-2 font-medium text-sm">Totaal</div>
              <div className="col-span-1"></div>
            </div>
            
            {form.watch('items').map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 p-3 border-b items-center">
                <div className="col-span-5">
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
  );
}
