import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedView } from '@/components/themed-view';
import { hasSeenWelcome } from '@/utils/storage';
import '@/utils/i18n'; // Initialize i18n

// TEMPORARY: Set to true to always show welcome screen for testing
const FORCE_WELCOME = true; // 👈 Change this to true to test welcome screen

export const unstable_settings = {
  // Remove anchor temporarily to allow index.tsx to run
  // anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure Stack is mounted before navigation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return; // Wait for Stack to mount

    const checkWelcome = async () => {
      try {
        if (FORCE_WELCOME) {
          // Force welcome screen
          router.replace('/welcome');
          setIsChecking(false);
          return;
        }

        const hasSeen = await hasSeenWelcome();
        if (!hasSeen) {
          // Show welcome screen
          router.replace('/welcome');
        } else {
          // Navigate to tabs if already seen welcome
          router.replace('/(tabs)/');
        }
      } catch (error) {
        console.error('Error checking welcome status:', error);
        router.replace('/(tabs)/');
      } finally {
        setIsChecking(false);
      }
    };

    checkWelcome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]); // Run when Stack is mounted

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {isChecking && (
        <ThemedView
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          }}>
          <ActivityIndicator size="large" color="#3f51b5" />
        </ThemedView>
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
