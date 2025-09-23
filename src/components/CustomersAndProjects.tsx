import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { CustomerForm } from './CustomerForm';
import { ProjectForm } from './ProjectForm';
import { Customers } from './Customers';
import { ProjectsBoard } from './ProjectsBoard';

export const CustomersAndProjects = () => {
  const { hasPermission } = useAuth();
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  const handleCustomerCreated = () => {
    setNewCustomerDialogOpen(false);
  };

  const handleProjectCreated = () => {
    setNewProjectDialogOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Klanten en Projecten</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Beheer je klanten en projecten vanaf één plek</p>
        </div>
      </div>

      {/* Quick Add Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasPermission('customers_edit') && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setNewCustomerDialogOpen(true)}>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nieuwe Klant Toevoegen</h3>
                <p className="text-gray-600">Voeg een nieuwe klant toe aan het systeem</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {hasPermission('projects_edit') && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setNewProjectDialogOpen(true)}>
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nieuw Project Toevoegen</h3>
                <p className="text-gray-600">Start een nieuw project voor een klant</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs for Customers and Projects */}
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Klanten
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Projecten
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="customers" className="space-y-4">
          <Customers />
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          <ProjectsBoard />
        </TabsContent>
      </Tabs>

      {/* New Customer Dialog */}
      <Dialog open={newCustomerDialogOpen} onOpenChange={setNewCustomerDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuwe klant toevoegen</DialogTitle>
            <DialogDescription>
              Vul de klantgegevens in om een nieuwe klant toe te voegen.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm onClose={handleCustomerCreated} />
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuw project toevoegen</DialogTitle>
            <DialogDescription>
              Vul de projectgegevens in om een nieuw project toe te voegen.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm onClose={handleProjectCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersAndProjects;