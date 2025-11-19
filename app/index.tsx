import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { hasSeenWelcome } from '@/utils/storage';
import WelcomeScreen from './welcome';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // TEMPORARY: Set to true to always show welcome screen for testing
  const FORCE_WELCOME = true; // 👈 Change this to true to test welcome screen

  useEffect(() => {
    const checkWelcome = async () => {
      try {
        if (FORCE_WELCOME) {
          setShowWelcome(true);
          setIsChecking(false);
          return;
        }
        
        const hasSeen = await hasSeenWelcome();
        if (!hasSeen) {
          setShowWelcome(true);
        } else {
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
  }, []);

  if (isChecking) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </ThemedView>
    );
  }

  if (showWelcome) {
    return <WelcomeScreen />;
  }

  return null;
}

