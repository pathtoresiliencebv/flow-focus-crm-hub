import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

  // Check for cached session (for instant auth on page reload)
  const getCachedSession = () => {
    try {
      const sessionStr = localStorage.getItem('supabase.auth.token');
      if (sessionStr) {
        const sessionData = JSON.parse(sessionStr);
        // Check if session is still valid (not expired)
        if (sessionData.expires_at && sessionData.expires_at * 1000 > Date.now()) {
          console.log('✅ Using cached session data');
          return {
            user: sessionData.user,
            session: sessionData
          };
        }
      }
    } catch (e) {
      console.error('Error loading cached session:', e);
    }
    return null;
  };

  const cachedProfile = getCachedProfile();
  const cachedAuth = getCachedSession();
  
  const [user, setUser] = useState<User | null>(cachedAuth?.user || null);
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [session, setSession] = useState<Session | null>(cachedAuth?.session || null);
  const [isLoading, setIsLoading] = useState(!cachedAuth && !cachedProfile);

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
        // ✅ OPTIMISTIC RENDERING: Check for cached auth inside useEffect to avoid re-render loop
        const hasCachedAuth = cachedAuth || cachedProfile;
        
        if (hasCachedAuth) {
          console.log('✅ Using cached auth, validating in background...');
          if (mounted) {
            // ✅ CRITICAL: Set loading to FALSE immediately for instant UI render
            setIsLoading(false);
          }
          
          // ✅ Background validation (non-blocking) - moved to Promise for true async
          supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (!mounted) return;
            
            // Only update if session is invalid
            if (error || !session) {
              console.warn('⚠️ Cached session invalid, clearing auth state');
              setUser(null);
              setSession(null);
              setProfile(null);
              localStorage.removeItem('user_profile_cache');
              return;
            }
            
            // Update state only if session changed
            const cachedToken = cachedAuth?.session?.access_token;
            if (session.access_token !== cachedToken) {
              console.log('🔄 Session changed, updating state...');
              setSession(session);
              setUser(session.user);
              fetchProfile(session.user);
            } else {
              console.log('✅ Cached session is still valid');
            }
          });
          
          // ✅ Return immediately - don't wait for validation
          return;
        }
        
        // ❌ NO CACHE: Normal flow - fetch session and show loading
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }
        
        if (mounted && session) {
          console.log('✅ Session restored from storage');
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            console.log('🔄 Fetching profile data...');
            await fetchProfile(currentUser);
          }
          setIsLoading(false);
        } else {
          console.log('⚠️ No session found, user needs to login');
          if (mounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            setIsLoading(false);
          }
        }
        
        // Set up auth state change listener - ONLY for actual auth changes
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted || event === 'INITIAL_SESSION') return;
          
          console.log('🔐 Auth state changed:', event, session ? 'with session' : 'no session');
          
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            console.log('🔄 User signed in or token refreshed, fetching profile...');
            await fetchProfile(currentUser);
          } else if (!currentUser && event === 'SIGNED_OUT') {
            console.log('🚪 User signed out, clearing profile...');
            setProfile(null);
            localStorage.removeItem('user_profile_cache');
          }
          
          if (mounted) {
            setIsLoading(false);
          }
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]); // Only fetchProfile - other values checked inside effect to prevent infinite loop

  // Add login lock to prevent multiple simultaneous calls
  const loginInProgressRef = useRef(false);

  const login = async (email: string, password: string, preferredLanguage: string = 'nl') => {
    // Prevent multiple simultaneous login attempts
    if (loginInProgressRef.current) {
      console.log('⏸️ Login already in progress, skipping duplicate attempt');
      return;
    }
    
    loginInProgressRef.current = true;
    console.log('🔐 Login attempt:', { email, preferredLanguage });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
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
      }
      
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
    } catch (err) {
      console.error('❌ Unexpected login error:', err);
      toast({
        title: "Inloggen mislukt",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive"
      });
    } finally {
      // Always reset the login lock
      loginInProgressRef.current = false;
      console.log('🔓 Login state reset, ready for next login');
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