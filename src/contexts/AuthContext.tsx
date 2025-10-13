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

  // Check for cached profile first
  const getCachedProfile = () => {
    try {
      const cached = localStorage.getItem('user_profile_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // ✅ Cache expires after 5 minutes to ensure fresh data
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL) {
          const ageSeconds = Math.round((Date.now() - parsed.timestamp) / 1000);
          console.log(`✅ CACHE: Using cached profile (${ageSeconds}s old)`);
          return parsed.profile;
        } else {
          console.log('⚠️ CACHE: Profile cache expired, will fetch fresh');
        }
      }
    } catch (e) {
      console.error('❌ CACHE: Error loading cached profile:', e);
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
          const expiresIn = Math.round((sessionData.expires_at * 1000 - Date.now()) / 1000 / 60);
          console.log(`✅ CACHE: Using cached session (expires in ${expiresIn} min)`);
          return {
            user: sessionData.user,
            session: sessionData
          };
        } else {
          console.log('⚠️ CACHE: Session cache expired');
        }
      }
    } catch (e) {
      console.error('❌ CACHE: Error loading cached session:', e);
    }
    return null;
  };

  const cachedProfile = getCachedProfile();
  const cachedAuth = getCachedSession();
  
  const [user, setUser] = useState<User | null>(cachedAuth?.user || null);
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [session, setSession] = useState<Session | null>(cachedAuth?.session || null);
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
      
      // Cache profile data in localStorage
      try {
        localStorage.setItem('user_profile_cache', JSON.stringify({
          profile: fullProfile,
          timestamp: Date.now()
        }));
        console.log('✅ CACHE: Profile cached successfully');
      } catch (e) {
        console.error('❌ CACHE: Error caching profile:', e);
      }
      
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
      localStorage.removeItem('user_profile_cache');
    }
  }, [startLoadingProfile, startLoadingPermissions, setReady]);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;
    
    const initializeAuth = async () => {
      try {
        // Check for cached auth - but WAIT for validation before showing content
        const hasCachedAuth = cachedAuth || cachedProfile;
        
        if (hasCachedAuth) {
          // ✅ Notify loading machine: authenticating with cache
          startAuthenticating(true);
          console.log('🔄 AUTH: Found cached auth, validating with server...');
          
          // ✅ Notify loading machine: validating cache
          startValidatingCache();
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (!mounted) return;
          
          // ✅ If session is invalid, notify loading machine: unauthenticated
          if (error || !session) {
            console.warn('❌ AUTH: Cached session invalid, resetting to login state');
            setUser(null);
            setSession(null);
            setProfile(null);
            setUnauthenticated(); // ✅ Notify loading machine
            localStorage.removeItem('user_profile_cache');
            return;
          }
          
          // Session is valid - update state if needed
          const cachedToken = cachedAuth?.session?.access_token;
          if (session.access_token !== cachedToken) {
            console.log('🔄 AUTH: Session token changed, fetching fresh profile...');
            setSession(session);
            setUser(session.user);
            await fetchProfile(session.user); // ✅ This calls setReady internally
          } else {
            console.log('✅ AUTH: Cached session is still valid');
            // Ensure state is set from cache
            setSession(session);
            setUser(session.user);
            // ✅ Notify loading machine: ready (using cached data)
            if (cachedProfile) {
              setReady({
                id: session.user.id,
                email: session.user.email!,
                role: cachedProfile.role,
                isAdmin: cachedProfile.role === 'Administrator'
              });
            }
          }
          
          // Continue to set up listener
        } else {
          // NO CACHE: Normal flow - fetch session and show loading
          // ✅ Notify loading machine: authenticating without cache
          startAuthenticating(false);
          console.log('🔄 AUTH: No cache found, fetching session...');
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
            console.log('✅ AUTH: Session restored from storage');
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
            localStorage.removeItem('user_profile_cache');
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
  }, [fetchProfile, startAuthenticating, startValidatingCache, setUnauthenticated, setError, setReady]); // Loading machine dependencies

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