import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NylasContact {
  id: string;
  nylas_account_id: string;
  nylas_contact_id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  notes: {
    job_title?: string;
    birthday?: string;
    source?: string;
    picture_url?: string;
    raw_data?: any;
  };
  created_at: string;
  updated_at: string;
}

interface UseNylasContactsState {
  contacts: NylasContact[];
  loading: boolean;
  error: string | null;
}

export const useNylasContacts = () => {
  const [state, setState] = useState<UseNylasContactsState>({
    contacts: [],
    loading: false,
    error: null,
  });

  /**
   * Fetch contacts from database
   */
  const fetchContacts = useCallback(async (accountId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('👥 Fetching contacts from database:', { accountId });

      const { data, error } = await supabase
        .from('nylas_contacts')
        .select('*')
        .eq('nylas_account_id', accountId)
        .order('name', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        contacts: data || [],
        loading: false,
        error: null,
      }));

      console.log('✅ Loaded', data?.length || 0, 'contacts from database');
      return data;
    } catch (err: any) {
      console.error('❌ Error fetching contacts:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, []);

  /**
   * Sync contacts from Nylas API
   */
  const syncContacts = useCallback(async (accountId: string, fullSync: boolean = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔄 Syncing contacts from Nylas API:', { accountId, fullSync });

      const { data, error } = await supabase.functions.invoke('nylas-sync-contacts', {
        body: { accountId, fullSync },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Contact sync failed');
      }

      console.log('✅ Contacts synced:', data);

      // Refresh contacts from database
      await fetchContacts(accountId);

      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (err: any) {
      console.error('❌ Error syncing contacts:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, [fetchContacts]);

  /**
   * Create new contact
   */
  const createContact = useCallback(async (params: {
    accountId: string;
    email: string;
    name?: string;
    company?: string;
    phone?: string;
    jobTitle?: string;
    birthday?: string;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('👥 Creating contact via Nylas:', {
        accountId: params.accountId,
        email: params.email,
        name: params.name,
      });

      const { data, error } = await supabase.functions.invoke('nylas-create-contact', {
        body: params,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to create contact');
      }

      console.log('✅ Contact created successfully:', data);

      // Refresh contacts from database
      await fetchContacts(params.accountId);

      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (err: any) {
      console.error('❌ Error creating contact:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, [fetchContacts]);

  /**
   * Update contact
   */
  const updateContact = useCallback(async (contactId: string, updates: Partial<NylasContact>) => {
    try {
      const { error } = await supabase
        .from('nylas_contacts')
        .update(updates)
        .eq('id', contactId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        contacts: prev.contacts.map(contact =>
          contact.id === contactId ? { ...contact, ...updates } : contact
        ),
      }));

      console.log('✅ Contact updated successfully');
    } catch (err: any) {
      console.error('❌ Error updating contact:', err);
      throw err;
    }
  }, []);

  /**
   * Delete contact
   */
  const deleteContact = useCallback(async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('nylas_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        contacts: prev.contacts.filter(contact => contact.id !== contactId),
      }));

      console.log('✅ Contact deleted successfully');
    } catch (err: any) {
      console.error('❌ Error deleting contact:', err);
      throw err;
    }
  }, []);

  /**
   * Search contacts
   */
  const searchContacts = useCallback(async (
    accountId: string,
    query: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 Searching contacts:', { accountId, query });

      const { data, error } = await supabase
        .from('nylas_contacts')
        .select('*')
        .eq('nylas_account_id', accountId)
        .or(`email.ilike.%${query}%,name.ilike.%${query}%,company.ilike.%${query}%`)
        .order('name', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        contacts: data || [],
        loading: false,
        error: null,
      }));

      console.log('✅ Found', data?.length || 0, 'matching contacts');
      return data;
    } catch (err: any) {
      console.error('❌ Error searching contacts:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    }
  }, []);

  /**
   * Get contact by email
   */
  const getContactByEmail = useCallback((email: string): NylasContact | null => {
    return state.contacts.find(contact => 
      contact.email.toLowerCase() === email.toLowerCase()
    ) || null;
  }, [state.contacts]);

  /**
   * Get contacts by company
   */
  const getContactsByCompany = useCallback((company: string): NylasContact[] => {
    return state.contacts.filter(contact => 
      contact.company?.toLowerCase().includes(company.toLowerCase())
    );
  }, [state.contacts]);

  /**
   * Get contact statistics
   */
  const getContactStats = useCallback(() => {
    const total = state.contacts.length;
    const withNames = state.contacts.filter(c => c.name).length;
    const withCompanies = state.contacts.filter(c => c.company).length;
    const withPhones = state.contacts.filter(c => c.phone).length;

    return {
      total,
      withNames,
      withCompanies,
      withPhones,
      completionRate: total > 0 ? Math.round(((withNames + withCompanies + withPhones) / (total * 3)) * 100) : 0,
    };
  }, [state.contacts]);

  return {
    // State
    contacts: state.contacts,
    loading: state.loading,
    error: state.error,

    // Actions
    fetchContacts,
    syncContacts,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,

    // Helpers
    getContactByEmail,
    getContactsByCompany,
    getContactStats,
  };
};


