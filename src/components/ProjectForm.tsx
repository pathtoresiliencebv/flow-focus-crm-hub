
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { mockCustomers } from '@/data/mockData';

// Define the form schema
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Projectnaam moet minimaal 3 karakters bevatten.",
  }),
  customer: z.string().min(1, {
    message: "Selecteer een klant.",
  }),
  date: z.string().min(1, {
    message: "Datum is verplicht.",
  }),
  value: z.string().min(1, {
    message: "Waarde is verplicht.",
  }),
  status: z.enum(["Te plannen", "Gepland", "In uitvoering", "Herkeuring", "Afgerond"]),
});

interface ProjectFormProps {
  onClose: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onClose }) => {
  const { toast } = useToast();
  
  // Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customer: "",
      date: new Date().toISOString().split('T')[0],
      value: "",
      status: "Te plannen",
    },
  });

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, we would send this to the backend
    // For now, we'll just show a success toast
    toast({
      title: "Project aangemaakt",
      description: `Project "${values.title}" is succesvol aangemaakt.`,
    });
    
    onClose();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projectnaam</FormLabel>
              <FormControl>
                <Input placeholder="Voer projectnaam in" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Klant</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een klant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mockCustomers.map(customer => (
                    <SelectItem key={customer.id} value={customer.name}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Datum</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projectwaarde (€)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Te plannen">Te plannen</SelectItem>
                  <SelectItem value="Gepland">Gepland</SelectItem>
                  <SelectItem value="In uitvoering">In uitvoering</SelectItem>
                  <SelectItem value="Herkeuring">Herkeuring</SelectItem>
                  <SelectItem value="Afgerond">Afgerond</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button type="submit">Project aanmaken</Button>
        </div>
      </form>
    </Form>
  );
};
