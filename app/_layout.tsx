import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      console.log('Still loading auth state...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    console.log('Auth state:', {
      hasSession: !!session,
      inAuthGroup,
      segments,
    });

    if (!session && !inAuthGroup) {
      console.log('No session, redirecting to login...');
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      console.log('Has session, redirecting to tabs...');
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Since we're not using custom fonts for now, we can hide the splash screen immediately
    SplashScreen.hideAsync();
    window.frameworkReady?.();
  }, []);

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

// Update the initial route
export const unstable_settings = {
  initialRouteName: "(auth)/login",
};