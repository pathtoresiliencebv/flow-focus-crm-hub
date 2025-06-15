import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  full_name: string;
  role: 'Administrator' | 'Verkoper' | 'Installateur' | 'Administratie' | 'Bekijker';
  status: 'Actief' | 'Inactief';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (user: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role, status')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching profile:', error);
      toast({
        title: "Fout bij profiel ophalen",
        description: error.message,
        variant: "destructive",
      });
    }
    setProfile(data as UserProfile | null);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      let description = "Er is een onbekende fout opgetreden.";
      if (error.message === 'Invalid login credentials') {
        description = "Ongeldige inloggegevens. Controleer uw e-mailadres en wachtwoord.";
      } else if (error.message.includes('Email not confirmed')) {
        description = "Uw e-mailadres is nog niet bevestigd. Controleer uw inbox voor de bevestigingsmail.";
      } else {
        description = error.message;
      }

      toast({
        title: "Inloggen mislukt",
        description: description,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Ingelogd",
        description: `Welkom terug!`,
      });
    }
  };
  
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: window.location.origin
      },
    });

    if (error) {
      toast({
        title: "Registratie mislukt",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Registratie succesvol",
        description: "Controleer uw e-mail om uw account te verifiëren.",
      });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    toast({
      title: "Uitgelogd",
      description: "U bent succesvol uitgelogd.",
    });
  };

  return {
    user,
    profile,
    session,
    isLoading,
    login,
    signUp,
    logout,
    isAuthenticated: !!user,
  };
};
