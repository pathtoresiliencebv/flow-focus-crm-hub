# Supabase Setup voor Monteur App

## Stap 1: Supabase Client Initialisatie

### 📁 Maak bestand: `lib/supabase.ts`

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Stap 2: Environment Variables

### 📁 Maak bestand: `.env`

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://pvesgvkyiaqmsudmmtkc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZXNndmt5aWFxbXN1ZG1tdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MjM1NDYsImV4cCI6MjA0OTk5OTU0Nn0.jEi2U5QRV8y2izN0QLjfLOcpk2MrOFuxIgjQmr3EuDY
```

### 📁 Update: `app.json`

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": process.env.EXPO_PUBLIC_SUPABASE_URL,
      "supabaseAnonKey": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
}
```

## Stap 3: Installeer Dependencies

```bash
# Supabase en dependencies
npx expo install @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill

# Voor Base64 encoding (foto uploads)
npx expo install expo-file-system

# Voor camera/foto's
npx expo install expo-image-picker
```

## Stap 4: Auth Hook Aanpassen

### 📁 Update: `contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setProfile(data);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## Stap 5: Database Queries Setup

### 📁 Maak bestand: `hooks/useProjects.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customer:customers(name, address, city, zipcode)
        `)
        .eq('assigned_user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};
```

### 📁 Maak bestand: `hooks/useTimeEntries.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useTimeEntries = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['time-entries', user?.id, projectId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const startTime = useMutation({
    mutationFn: async (projectId: string) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user!.id,
          project_id: projectId,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  const stopTime = useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update({ 
          end_time: new Date().toISOString() 
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });

  return {
    ...query,
    startTime,
    stopTime,
  };
};
```

## Stap 6: Test Supabase Connectie

### 📁 Maak bestand: `app/test-supabase.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function TestSupabaseScreen() {
  const [status, setStatus] = useState<string>('Testing...');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').single();
      
      if (error) {
        setStatus(`❌ Error: ${error.message}`);
      } else {
        setStatus('✅ Supabase connected successfully!');
      }
    } catch (err: any) {
      setStatus(`❌ Connection failed: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
```

## Checklist

- [ ] `lib/supabase.ts` aangemaakt
- [ ] `.env` file met Supabase credentials
- [ ] Dependencies geïnstalleerd
- [ ] AuthContext aangepast voor Supabase
- [ ] useProjects hook gemaakt
- [ ] useTimeEntries hook gemaakt
- [ ] Test screen werkt (✅ connected)

## Volgende Stap

Zie **03-SCREENS-IMPLEMENTATIE.md** voor het bouwen van de daadwerkelijke screens.

