import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';
import { Permission, UserRole } from '@/types/permissions';
import { useLoadingState } from '@/contexts/LoadingStateContext';

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
  // ❌ REMOVED: isLoading (now managed by LoadingStateContext)
  // isLoading: boolean;
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
  // ✅ Use centralized loading state machine
  const {
    startAuthenticating,
    startValidatingCache,
    startLoadingProfile,
    startLoadingPermissions,
    setReady,
    setError,
    setUnauthenticated
  } = useLoadingState();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // ❌ REMOVED: Local isLoading state (now managed by LoadingStateContext)
  // const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (user: User) => {
    // ✅ Notify loading machine
    startLoadingProfile(user.id);
    console.log('🔄 PROFILE: Fetching profile for user', user.id);
    const startTime = Date.now();
    
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('full_name, role, status, chat_language')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ PROFILE: Error fetching profile:', error);
      toast({
        title: "Fout bij profiel ophalen",
        description: error.message,
        variant: "destructive",
      });
      setProfile(null);
      return;
    }

    if (profileData) {
      const profileLoadTime = Date.now() - startTime;
      console.log(`✅ PROFILE: Profile loaded in ${profileLoadTime}ms`, {
        role: profileData.role,
        full_name: profileData.full_name
      });
      
      // ✅ Notify loading machine: fetching permissions
      startLoadingPermissions(user.id);
      const permStartTime = Date.now();
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', profileData.role);
      
      const permLoadTime = Date.now() - permStartTime;
      console.log(`✅ PROFILE: Permissions loaded in ${permLoadTime}ms (${permissionsData?.length || 0} permissions)`);
      
      if (permissionsError) {
        console.error('❌ PROFILE: Error fetching permissions:', permissionsError);
        toast({
          title: "Fout bij rechten ophalen",
          description: permissionsError.message,
          variant: "destructive",
        });
      }

      const permissions = permissionsData?.map(p => p.permission as Permission) || [];
      const fullProfile = { ...profileData, permissions };
      setProfile(fullProfile);
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ PROFILE: Complete in ${totalTime}ms`);
      
      // ✅ Notify loading machine: auth is ready
      setReady({
        id: user.id,
        email: user.email!,
        role: profileData.role,
        isAdmin: profileData.role === 'Administrator'
      });
    } else {
      console.log('⚠️ PROFILE: No profile data found for user');
      setProfile(null);
    }
  }, [startLoadingProfile, startLoadingPermissions, setReady]);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;
    
    const initializeAuth = async () => {
      try {
        // ✅ Notify loading machine: authenticating
        startAuthenticating(false);
        console.log('🔄 AUTH: Fetching session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AUTH: Error getting session:', error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            // ✅ Notify loading machine: error
            setError({
              code: 'SESSION_ERROR',
              message: error.message,
              canRetry: true,
              timestamp: new Date()
            });
          }
          return;
        }
        
        if (mounted && session) {
          console.log('✅ AUTH: Session found, fetching profile...');
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
        
          if (currentUser) {
            console.log('🔄 AUTH: Fetching profile data...');
            await fetchProfile(currentUser); // ✅ This calls setReady internally
          }
        } else {
          console.log('⚠️ AUTH: No session found, user needs to login');
          if (mounted) {
            setUser(null);
            setSession(null);
            setProfile(null);
            // ✅ Notify loading machine: unauthenticated
            setUnauthenticated();
          }
        }
        
        // Set up auth state change listener - ONLY for actual auth changes
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted || event === 'INITIAL_SESSION') return;
          
          console.log('🔐 AUTH EVENT:', event, session ? 'with session' : 'no session');
          
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            console.log('🔄 AUTH: User signed in or token refreshed, fetching profile...');
            await fetchProfile(currentUser); // ✅ This calls setReady internally
            console.log('✅ AUTH: Profile fetch complete');
          } else if (!currentUser && event === 'SIGNED_OUT') {
            console.log('🚪 AUTH: User signed out, clearing profile...');
            setProfile(null);
            // ✅ Notify loading machine: unauthenticated
            setUnauthenticated();
          }
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('❌ AUTH: Critical error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setProfile(null);
          // ✅ Notify loading machine: error
          setError({
            code: 'AUTH_INIT_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            canRetry: true,
            timestamp: new Date()
          });
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile, startAuthenticating, setUnauthenticated, setError, setReady]); // Loading machine dependencies

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
    // ❌ REMOVED: isLoading (use useLoadingState() instead)
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