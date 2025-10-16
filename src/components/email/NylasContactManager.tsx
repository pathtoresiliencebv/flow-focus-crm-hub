import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Edit, 
  Trash2, 
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { useNylasContacts } from '@/hooks/useNylasContacts';
import { toast } from 'sonner';

interface NylasContactManagerProps {
  className?: string;
}

interface Contact {
  id: string;
  nylas_contact_id: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  notes?: any;
  created_at: string;
  updated_at: string;
}

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
}

export function NylasContactManager({ className = '' }: NylasContactManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: ''
  });

  const { 
    contacts: hookContacts, 
    loading: contactsLoading, 
    error: contactsError,
    fetchContacts, 
    createContact, 
    updateContact, 
    deleteContact 
  } = useNylasContacts();

  // Load contacts
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Update local state when hook data changes
  useEffect(() => {
    if (hookContacts) {
      setContacts(hookContacts);
      setFilteredContacts(hookContacts);
    }
  }, [hookContacts]);

  // Update loading state
  useEffect(() => {
    setLoading(contactsLoading);
  }, [contactsLoading]);

  // Update error state
  useEffect(() => {
    if (contactsError) {
      setError(contactsError);
    }
  }, [contactsError]);

  // Filter contacts based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, contacts]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Handle form input changes
  const handleFormChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      notes: ''
    });
    setEditingContact(null);
    setShowForm(false);
  };

  // Handle create/edit contact
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Email is verplicht');
      return;
    }

    setIsProcessing(true);

    try {
      const contactData = {
        name: formData.name.trim() || undefined,
        email: formData.email.trim(),
        company: formData.company.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        notes: formData.notes.trim() ? { note: formData.notes.trim() } : undefined
      };

      if (editingContact) {
        await updateContact(editingContact.id, contactData);
        toast.success('Contact bijgewerkt');
      } else {
        await createContact(contactData);
        toast.success('Contact toegevoegd');
      }

      resetForm();
      fetchContacts(); // Refresh contacts
    } catch (err) {
      console.error('Error saving contact:', err);
      toast.error('Fout bij opslaan van contact');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle edit contact
  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      email: contact.email,
      company: contact.company || '',
      phone: contact.phone || '',
      notes: contact.notes?.note || ''
    });
    setShowForm(true);
  };

  // Handle delete contact
  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Weet je zeker dat je ${contact.name || contact.email} wilt verwijderen?`)) {
      return;
    }

    setIsProcessing(true);

    try {
      await deleteContact(contact.id);
      toast.success('Contact verwijderd');
      fetchContacts(); // Refresh contacts
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error('Fout bij verwijderen van contact');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Contacten laden...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchContacts} 
              className="mt-4"
            >
              Opnieuw proberen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contacten ({contacts.length})
            </CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nieuw Contact
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Zoek contacten..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      {showForm && (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingContact ? 'Contact Bewerken' : 'Nieuw Contact'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Naam</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Volledige naam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <Input
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bedrijf</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => handleFormChange('company', e.target.value)}
                    placeholder="Bedrijfsnaam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telefoon</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="+31 6 12345678"
                    type="tel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notities</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Extra informatie over dit contact..."
                  className="w-full p-2 border border-gray-300 rounded-md resize-none h-20"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  {editingContact ? 'Bijwerken' : 'Toevoegen'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isProcessing}
                >
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Contacts List */}
      <Card>
        <CardContent className="p-0">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Geen contacten gevonden' : 'Nog geen contacten'}
              </p>
              {!searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setShowForm(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Eerste contact toevoegen
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {contact.name || contact.email}
                            </h3>
                            {contact.name && (
                              <Badge variant="secondary" className="text-xs">
                                {contact.email}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{contact.email}</span>
                            </div>
                            
                            {contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            
                            {contact.company && (
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                <span>{contact.company}</span>
                              </div>
                            )}
                          </div>
                          
                          {contact.notes?.note && (
                            <p className="text-sm text-gray-500 mt-1">
                              {contact.notes.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        {formatDate(contact.created_at)}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                        disabled={isProcessing}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact)}
                        disabled={isProcessing}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

