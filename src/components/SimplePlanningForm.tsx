
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useUsers } from "@/hooks/useUsers";
import { format } from "date-fns";

interface SimplePlanningFormProps {
  selectedDate?: Date;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const SimplePlanningForm = ({ selectedDate, onClose, onSubmit }: SimplePlanningFormProps) => {
  const { toast } = useToast();
  const { projects } = useCrmStore();
  const { monteurs } = useUsers();

  const [formData, setFormData] = useState({
    title: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    startTime: '09:00',
    endTime: '17:00',
    isFullDay: false,
    project: '',
    employee: '',
    location: '',
    description: '',
    travelTime: ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.employee) {
      toast({
        title: "Vereiste velden",
        description: "Vul alle vereiste velden in.",
        variant: "destructive"
      });
      return;
    }

    // Map form data to expected format
    const planningData = {
      title: formData.title,
      date: formData.date,
      startTime: formData.isFullDay ? '00:00:00' : `${formData.startTime}:00`,
      endTime: formData.isFullDay ? '23:59:59' : `${formData.endTime}:00`,
      location: formData.location,
      description: formData.description,
      assignedUserId: formData.employee, // Map employee to assignedUserId
      projectId: formData.project || null
    };

    console.log('📋 SimplePlanningForm submitting:', planningData);
    onSubmit(planningData);
    // Toast and close will be handled by parent component
  };

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4">Nieuwe Planning</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Naam *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Bijv. Kozijnen installatie"
              className="mt-1"
              required
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Locatie of videogesprek
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Adres of online meeting link"
              className="mt-1"
            />
          </div>

          {/* Full Day Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isFullDay" className="text-sm font-medium text-gray-700">
              Hele dag
            </Label>
            <Switch
              id="isFullDay"
              checked={formData.isFullDay}
              onCheckedChange={(checked) => handleInputChange('isFullDay', checked)}
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Begin:
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="bg-gray-100"
                  required
                />
                {!formData.isFullDay && (
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="bg-gray-100"
                  />
                )}
              </div>
            </div>

            {!formData.isFullDay && (
              <div>
                <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">
                  Einde:
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    type="date"
                    value={formData.date}
                    className="bg-gray-100"
                    disabled
                  />
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="bg-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Travel Time */}
          <div>
            <Label htmlFor="travelTime" className="text-sm font-medium text-gray-700">
              Reistijd
            </Label>
            <Select onValueChange={(value) => handleInputChange('travelTime', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Geen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen</SelectItem>
                <SelectItem value="15min">15 minuten</SelectItem>
                <SelectItem value="30min">30 minuten</SelectItem>
                <SelectItem value="1hr">1 uur</SelectItem>
                <SelectItem value="2hr">2 uur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee */}
          <div>
            <Label htmlFor="employee" className="text-sm font-medium text-gray-700">
              Monteur *
            </Label>
            <Select value={formData.employee} onValueChange={(value) => handleInputChange('employee', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Kies monteur" />
              </SelectTrigger>
              <SelectContent>
                {monteurs.map((monteur) => (
                  <SelectItem key={monteur.id} value={monteur.id}>
                    {monteur.full_name || monteur.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div>
            <Label htmlFor="project" className="text-sm font-medium text-gray-700">
              Project
            </Label>
            <Select onValueChange={(value) => handleInputChange('project', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Kies project (optioneel)" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title} - {project.customer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Beschrijving
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Extra details over deze planning..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Opslaan
            </Button>
          </div>
        </form>
    </div>
  );
};
