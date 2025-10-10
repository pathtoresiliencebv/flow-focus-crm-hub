import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';
import { Permission, UserRole } from '@/types/permissions';

interface UserProfile {
  full_name: string;
  role: UserRole;
  status: 'Actief' | 'Inactief';
  permissions: Permission[];
  chat_language?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string, preferredLanguage?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Check for cached profile first
  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem('user_profile_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is less than 30 minutes old (verhoogd van 5 naar 30 minuten)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          console.log('✅ Using cached profile data');
          return parsed.profile;
        }
      }
    } catch (e) {
      console.error('Error loading cached profile:', e);
    }
    return null;
  };

  const cachedProfile = getCachedProfile();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [session, setSession] = useState<Session | null>(null);
  // If we have cached profile, start with isLoading false to avoid auth spinner
  const [isLoading, setIsLoading] = useState(!cachedProfile);

  const fetchProfile = useCallback(async (user: User) => {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('full_name, role, status, chat_language')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      toast({
        title: "Fout bij profiel ophalen",
        description: error.message,
        variant: "destructive",
      });
      setProfile(null);
      return;
    }

    if (profileData) {
      console.log('🔐 AuthContext: Profile loaded:', {
        id: profileData.id,
        role: profileData.role,
        full_name: profileData.full_name
      });
      
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', profileData.role);
      
      console.log('🔐 AuthContext: Permissions query result:', {
        role: profileData.role,
        permissionsData,
        permissionsError,
        count: permissionsData?.length || 0
      });
      
      if (permissionsError) {
        console.error('❌ Error fetching permissions:', permissionsError);
        toast({
          title: "Fout bij rechten ophalen",
          description: permissionsError.message,
          variant: "destructive",
        });
      }

      const permissions = permissionsData?.map(p => p.permission as Permission) || [];
      console.log('✅ AuthContext: Permissions loaded:', permissions);
      
      const fullProfile = { ...profileData, permissions };
      setProfile(fullProfile);
      
      // Cache profile data in localStorage
      try {
        localStorage.setItem('user_profile_cache', JSON.stringify({
          profile: fullProfile,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error caching profile:', e);
      }
    } else {
      console.log('⚠️ AuthContext: No profile data found');
      setProfile(null);
      localStorage.removeItem('user_profile_cache');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;
    
    const initializeAuth = async () => {
      try {
        // Get session once
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (mounted) {
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            // Only fetch profile if we don't have cached profile or it's stale
            const hasCachedProfile = profile !== null;
            if (!hasCachedProfile) {
              console.log('🔄 Fetching fresh profile data...');
              await fetchProfile(currentUser);
            } else {
              console.log('✅ Using cached profile, will refresh in background');
              // Refresh profile in background without showing loading spinner
              fetchProfile(currentUser);
            }
          }
          setIsLoading(false); // Set loading false immediately if we have cache
        }
        
        // Listen to CHANGES only (not initial)
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted || event === 'INITIAL_SESSION') return; // Skip initial session event
          
          console.log('🔐 Auth state changed:', event);
          
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser && event === 'SIGNED_IN') {
            await fetchProfile(currentUser);
          } else if (!currentUser) {
            setProfile(null);
          }
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile, profile]);

  const login = async (email: string, password: string, preferredLanguage: string = 'nl') => {
    console.log('🔐 Login attempt:', { email, preferredLanguage });
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    console.log('🔐 Login response:', { 
      hasData: !!data, 
      hasUser: !!data?.user, 
      hasSession: !!data?.session,
      error: error?.message 
    });
    
    if (error) {
      console.error('❌ Login error:', error);
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
      return;
    } else {
      console.log('✅ Login successful, user ID:', data?.user?.id);
      // Update user's language preference after successful login
      if (data.user && preferredLanguage) {
        try {
          console.log(`🌍 Saving language preference: ${preferredLanguage} for user ${data.user.id}`);
          
          // Save to user_language_preferences (unified system)
          const { error: updateError } = await supabase
            .from('user_language_preferences')
            .upsert({ 
              user_id: data.user.id,
              ui_language: preferredLanguage,
              preferred_language: preferredLanguage, // Sync both fields
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (updateError) {
            console.error('❌ Error updating language preference:', updateError);
            // Don't fail login if language update fails - it's not critical
          } else {
            console.log(`✅ Language preference saved: ${preferredLanguage}`);
          }
        } catch (error) {
          console.error('❌ Error saving language preference:', error);
          // Silent fail - don't block login for language preference
        }
      }

      console.log('✅ Login complete - showing success toast');
      toast({
        title: "Ingelogd",
        description: `Welkom terug!`,
      });
    }
  };
  
  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'Bekijker') => {
    const { data, error } = await supabase.auth.signUp({
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
      console.error("Sign up error:", error);
      toast({
        title: "Registratie mislukt",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    if (data.user && role !== 'Bekijker') {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', data.user.id);

        if (roleError) {
          console.error("Error setting role:", roleError);
          toast({
            title: "Gebruiker aangemaakt, rol niet ingesteld",
            description: `De gebruiker is aangemaakt maar de rol kon niet worden ingesteld: ${roleError.message}`,
            variant: "destructive"
          });
        }
      } catch (roleError) {
        console.error("Error setting role:", roleError);
      }
    }

    toast({
      title: "Registratie succesvol",
      description: "Controleer uw e-mail om uw account te verifiëren.",
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    
    // Clear cached profile data
    try {
      localStorage.removeItem('user_profile_cache');
    } catch (e) {
      console.error('Error clearing cached profile:', e);
    }
    
    toast({
      title: "Uitgelogd",
      description: "U bent succesvol uitgelogd.",
    });
  };

  const hasPermission = (permission: Permission): boolean => {
    return profile?.permissions.includes(permission) ?? false;
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    login,
    signUp,
    logout,
    isAuthenticated: !!user,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};