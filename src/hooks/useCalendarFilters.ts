import { useState, useCallback } from 'react';
import { UserRole } from '@/types/permissions';

export interface CalendarFilters {
  roles: UserRole[];
  users: string[];
  showPersonalEvents: boolean;
}

export interface User {
  id: string;
  full_name: string;
  role: UserRole;
}

export const useCalendarFilters = () => {
  const [filters, setFilters] = useState<CalendarFilters>({
    roles: ['Administrator', 'Installateur', 'Administratie'],
    users: [],
    showPersonalEvents: true,
  });

  const toggleRole = useCallback((role: UserRole) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  }, []);

  const toggleUser = useCallback((userId: string) => {
    setFilters(prev => ({
      ...prev,
      users: prev.users.includes(userId)
        ? prev.users.filter(u => u !== userId)
        : [...prev.users, userId]
    }));
  }, []);

  const togglePersonalEvents = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      showPersonalEvents: !prev.showPersonalEvents
    }));
  }, []);

  const isRoleActive = useCallback((role: UserRole) => {
    return filters.roles.includes(role);
  }, [filters.roles]);

  const isUserActive = useCallback((userId: string) => {
    return filters.users.includes(userId);
  }, [filters.users]);

  return {
    filters,
    toggleRole,
    toggleUser,
    togglePersonalEvents,
    isRoleActive,
    isUserActive,
  };
};