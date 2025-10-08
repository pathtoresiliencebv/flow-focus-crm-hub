import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Mail, MessageSquare, ChevronRight, ChevronLeft } from "lucide-react";
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { useCrmStore } from '@/hooks/useCrmStore';
import { useRealUserStore } from '@/hooks/useRealUserStore';
import type { Customer, Project } from '@/hooks/useCrmStore';

interface CustomerPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanningFormData) => void;
  initialDate?: Date;
}

export interface PlanningFormData {
  planning_type: 'klant_afspraak' | 'monteur' | 'team' | 'intern';
  customer_id?: string;
  project_id?: string;
  title: string;
  description: string;
  start_date: Date;
  start_time: string;
  end_time: string;
  expected_duration_minutes: number;
  location: string;
  assigned_user_ids: string[];
  team_size: number;
  special_instructions: string;
  notify_customer: boolean;
  notify_sms: boolean;
}

export function CustomerPlanningDialog({
  open,
  onOpenChange,
  onSubmit,
  initialDate
}: CustomerPlanningDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'klant_afspraak' | 'monteur' | 'team'>('klant_afspraak');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '08:00',
    end_time: '17:00',
    expected_duration_minutes: 480,
    location: '',
    assigned_user_ids: [] as string[],
    team_size: 1,
    special_instructions: '',
    notify_customer: true,
    notify_sms: false,
  });

  const { customers, projects } = useCrmStore();
  const { installers } = useRealUserStore();

  // Filter customers based on search
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter projects for selected customer
  const customerProjects = selectedCustomer
    ? projects.filter(p => p.customer_id === selectedCustomer.id)
    : [];

  const handleNext = () => {
    if (step === 1 && selectedType === 'klant_afspraak' && !selectedCustomer) {
      return; // Can't proceed without customer
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    const planningData: PlanningFormData = {
      planning_type: selectedType,
      customer_id: selectedCustomer?.id,
      project_id: selectedProject?.id,
      title: formData.title,
      description: formData.description,
      start_date: date!,
      start_time: formData.start_time,
      end_time: formData.end_time,
      expected_duration_minutes: formData.expected_duration_minutes,
      location: formData.location,
      assigned_user_ids: formData.assigned_user_ids,
      team_size: formData.team_size,
      special_instructions: formData.special_instructions,
      notify_customer: formData.notify_customer,
      notify_sms: formData.notify_sms,
    };

    onSubmit(planningData);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType('klant_afspraak');
    setSelectedCustomer(null);
    setSelectedProject(null);
    setSearchTerm('');
    setFormData({
      title: '',
      description: '',
      start_time: '08:00',
      end_time: '17:00',
      expected_duration_minutes: 480,
      location: '',
      assigned_user_ids: [],
      team_size: 1,
      special_instructions: '',
      notify_customer: true,
      notify_sms: false,
    });
    onOpenChange(false);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      location: customer.address || '',
    }));
  };

  const totalSteps = selectedType === 'klant_afspraak' ? 5 : 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Planning Toevoegen</span>
            <Badge variant="outline">Stap {step}/{totalSteps}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* STEP 1: Type Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Selecteer Type Planning</h3>
              
              <div className="grid gap-4">
                <button
                  onClick={() => setSelectedType('klant_afspraak')}
                  className={cn(
                    "p-4 border-2 rounded-lg text-left transition-all hover:border-blue-500",
                    selectedType === 'klant_afspraak' ? "border-blue-600 bg-blue-50" : "border-gray-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">Klant Afspraak</h4>
                      <p className="text-sm text-gray-600">Plan een afspraak met een klant</p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        <li>• Notificaties naar klant</li>
                        <li>• Monteur toewijzing</li>
                        <li>• Automatische bevestiging</li>
                      </ul>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('monteur')}
                  className={cn(
                    "p-4 border-2 rounded-lg text-left transition-all hover:border-green-500",
                    selectedType === 'monteur' ? "border-green-600 bg-green-50" : "border-gray-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">Monteur Planning</h4>
                      <p className="text-sm text-gray-600">Interne planning voor monteur</p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        <li>• Geen klant notificaties</li>
                        <li>• Direct plannen</li>
                      </ul>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('team')}
                  className={cn(
                    "p-4 border-2 rounded-lg text-left transition-all hover:border-purple-500",
                    selectedType === 'team' ? "border-purple-600 bg-purple-50" : "border-gray-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">Team Project</h4>
                      <p className="text-sm text-gray-600">Multi-monteur planning</p>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        <li>• Meerdere monteurs</li>
                        <li>• Coördinatie tools</li>
                      </ul>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Selection (Only for klant_afspraak) */}
          {step === 2 && selectedType === 'klant_afspraak' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Selecteer Klant</h3>
              
              <Input
                placeholder="🔍 Zoek klant op naam, email of telefoon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCustomers.slice(0, 10).map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={cn(
                      "w-full p-3 border rounded-lg text-left transition-all hover:border-blue-500",
                      selectedCustomer?.id === customer.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{customer.name}</h4>
                        {customer.address && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {customer.address}
                          </p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs">
                          {customer.email && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </span>
                          )}
                          {customer.phone && (
                            <span className="flex items-center gap-1 text-gray-600">
                              📞 {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedCustomer?.id === customer.id && (
                        <Badge className="bg-blue-600">✓ Geselecteerd</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedCustomer && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Geselecteerde Klant:</h4>
                  <p className="text-sm">{selectedCustomer.name}</p>
                  {selectedCustomer.address && <p className="text-xs text-gray-600">{selectedCustomer.address}</p>}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Project & Details */}
          {((step === 3 && selectedType === 'klant_afspraak') || (step === 2 && selectedType !== 'klant_afspraak')) && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Planning Details</h3>

              {selectedType === 'klant_afspraak' && (
                <div className="space-y-2">
                  <Label>Project Koppeling (optioneel)</Label>
                  <Select
                    value={selectedProject?.id || 'new'}
                    onValueChange={(value) => {
                      if (value === 'new') {
                        setSelectedProject(null);
                      } else {
                        const project = customerProjects.find(p => p.id === value);
                        if (project) {
                          setSelectedProject(project);
                          setFormData(prev => ({
                            ...prev,
                            title: project.title,
                            description: project.description || '',
                          }));
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer of maak nieuw project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">➕ Nieuw Project</SelectItem>
                      {customerProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Bijv: Zonnepanelen installatie"
                />
              </div>

              <div className="space-y-2">
                <Label>Beschrijving</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Details van de werkzaamheden..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'dd MMMM yyyy', { locale: nl }) : 'Selecteer datum'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        locale={nl}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Verwachte Duur</Label>
                  <Select
                    value={formData.expected_duration_minutes.toString()}
                    onValueChange={(value) => {
                      const minutes = parseInt(value);
                      setFormData(prev => ({
                        ...prev,
                        expected_duration_minutes: minutes,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="120">2 uur</SelectItem>
                      <SelectItem value="240">4 uur</SelectItem>
                      <SelectItem value="480">8 uur (hele dag)</SelectItem>
                      <SelectItem value="720">12 uur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Tijd *</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Eind Tijd *</Label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Locatie *</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Adres van de locatie"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Monteur Selection */}
          {((step === 4 && selectedType === 'klant_afspraak') || (step === 3 && selectedType !== 'klant_afspraak')) && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Monteur Toewijzing</h3>

              <div className="space-y-2">
                {installers.map((installer) => (
                  <button
                    key={installer.id}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        assigned_user_ids: prev.assigned_user_ids.includes(installer.id)
                          ? prev.assigned_user_ids.filter(id => id !== installer.id)
                          : [...prev.assigned_user_ids, installer.id]
                      }));
                    }}
                    className={cn(
                      "w-full p-3 border rounded-lg text-left transition-all",
                      formData.assigned_user_ids.includes(installer.id)
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{installer.full_name || installer.email}</h4>
                        <p className="text-sm text-gray-600">{installer.email}</p>
                      </div>
                      {formData.assigned_user_ids.includes(installer.id) && (
                        <Badge className="bg-blue-600">✓</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Speciale Instructies</Label>
                <Textarea
                  value={formData.special_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                  placeholder="Bijv: Klant heeft hond - bel aan"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* STEP 5: Notifications (Only for klant_afspraak) */}
          {step === 5 && selectedType === 'klant_afspraak' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Notificaties</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email naar klant</p>
                      <p className="text-sm text-gray-600">{selectedCustomer?.email || 'Geen email beschikbaar'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.notify_customer}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_customer: checked }))}
                    disabled={!selectedCustomer?.email}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">SMS naar klant</p>
                      <p className="text-sm text-gray-600">{selectedCustomer?.phone || 'Geen telefoon beschikbaar'}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.notify_sms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notify_sms: checked }))}
                    disabled={!selectedCustomer?.phone}
                  />
                </div>

                {formData.notify_customer && selectedCustomer && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">📧 Email Preview:</h4>
                    <div className="text-sm space-y-2">
                      <p><strong>Aan:</strong> {selectedCustomer.email}</p>
                      <p><strong>Onderwerp:</strong> Afspraak bevestigd - {formData.title}</p>
                      <Separator />
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Beste {selectedCustomer.name},</p>
                        <p>Uw afspraak is ingepland:</p>
                        <p>📅 {date ? format(date, 'dd MMMM yyyy', { locale: nl }) : ''}</p>
                        <p>⏰ {formData.start_time} - {formData.end_time}</p>
                        <p>📍 {formData.location}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={step === 1 ? handleClose : handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {step === 1 ? 'Annuleren' : 'Vorige'}
            </Button>

            {step < totalSteps ? (
              <Button onClick={handleNext}>
                Volgende
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!formData.title || !date || formData.assigned_user_ids.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                🚀 Planning Aanmaken
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

