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
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
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