import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { Platform } from 'react-native';

// Import styles for web platform
if (Platform.OS === 'web') {
  require('../src/index.css');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // ✅ 5 minuten cache - sync met web
      gcTime: 10 * 60 * 1000, // ✅ 10 minuten in memory - voorkomt herlaad
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TranslationProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: 'hsl(var(--background))',
              },
              headerTintColor: 'hsl(var(--foreground))',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
            <Stack.Screen name="quotes" options={{ title: 'Offertes' }} />
            <Stack.Screen name="invoices" options={{ title: 'Facturen' }} />
            <Stack.Screen name="settings" options={{ title: 'Instellingen' }} />
          </Stack>
        </TranslationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}