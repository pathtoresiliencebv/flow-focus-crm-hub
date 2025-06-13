
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  status: "Actief" | "In behandeling" | "Inactief";
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  customer: string;
  customerId: number;
  date: string;
  value: string;
  status: "te-plannen" | "gepland" | "in-uitvoering" | "herkeuring" | "afgerond";
  description: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  CUSTOMERS: 'crm_customers',
  PROJECTS: 'crm_projects'
};

// Initial data
const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Jan de Vries",
    email: "jan@example.com",
    phone: "06-12345678",
    address: "Hoofdstraat 123",
    city: "Amsterdam",
    notes: "Geïnteresseerd in kunststof kozijnen",
    status: "Actief",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Marie Jansen",
    email: "marie@example.com",
    phone: "06-87654321",
    address: "Kerkstraat 45",
    city: "Utrecht",
    notes: "Wil offerte voor aluminium ramen",
    status: "In behandeling",
    createdAt: new Date().toISOString()
  }
];

const initialProjects: Project[] = [
  {
    id: "1",
    title: "Kozijnen vervangen",
    customer: "Jan de Vries",
    customerId: 1,
    date: "2025-01-15",
    value: "4500",
    status: "te-plannen",
    description: "Vervangen van 6 kozijnen in woonhuis",
    createdAt: new Date().toISOString()
  },
  {
    id: "2",
    title: "Nieuwe ramen installeren",
    customer: "Marie Jansen",
    customerId: 2,
    date: "2025-01-20",
    value: "7500",
    status: "gepland",
    description: "Installatie van nieuwe aluminium ramen",
    createdAt: new Date().toISOString()
  }
];

export const useCrmStore = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);

    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    } else {
      setCustomers(initialCustomers);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    }

    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      setProjects(initialProjects);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(initialProjects));
    }
  }, []);

  // Customer functions
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    
    toast({
      title: "Klant toegevoegd",
      description: `${newCustomer.name} is succesvol toegevoegd.`,
    });
    
    return newCustomer;
  };

  const updateCustomer = (id: number, customerData: Partial<Customer>) => {
    const updatedCustomers = customers.map(customer =>
      customer.id === id ? { ...customer, ...customerData } : customer
    );
    setCustomers(updatedCustomers);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    
    toast({
      title: "Klant bijgewerkt",
      description: "Klantgegevens zijn succesvol bijgewerkt.",
    });
  };

  const deleteCustomer = (id: number) => {
    const updatedCustomers = customers.filter(customer => customer.id !== id);
    setCustomers(updatedCustomers);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    
    toast({
      title: "Klant verwijderd",
      description: "Klant is succesvol verwijderd.",
    });
  };

  // Project functions
  const addProject = (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));
    
    toast({
      title: "Project aangemaakt",
      description: `${newProject.title} is succesvol aangemaakt.`,
    });
    
    return newProject;
  };

  const updateProject = (id: string, projectData: Partial<Project>) => {
    const updatedProjects = projects.map(project =>
      project.id === id ? { ...project, ...projectData } : project
    );
    setProjects(updatedProjects);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));
    
    toast({
      title: "Project bijgewerkt",
      description: "Project is succesvol bijgewerkt.",
    });
  };

  const deleteProject = (id: string) => {
    const updatedProjects = projects.filter(project => project.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updatedProjects));
    
    toast({
      title: "Project verwijderd",
      description: "Project is succesvol verwijderd.",
    });
  };

  return {
    customers,
    projects,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addProject,
    updateProject,
    deleteProject
  };
};
