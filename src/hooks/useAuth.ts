
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  email: string;
  name: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    // For demo purposes, create a user object
    const userData: User = {
      email,
      name: email.split('@')[0].replace('.', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    };

    setUser(userData);
    localStorage.setItem('crm_user', JSON.stringify(userData));
    
    toast({
      title: "Ingelogd",
      description: `Welkom terug, ${userData.name}!`,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
    
    toast({
      title: "Uitgelogd",
      description: "U bent succesvol uitgelogd.",
    });
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  };
};
