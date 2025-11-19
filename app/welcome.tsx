import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { setHasSeenWelcome } from '@/utils/storage';
import { welcomeStyles as styles } from './styles/welcome.styles';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      await setHasSeenWelcome();
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Error saving welcome status:', error);
      // Still navigate even if save fails
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* App Name Section - Completely separate */}
          <View style={styles.appNameSection}>
            <ThemedText style={styles.appName}>Daily Cigs</ThemedText>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <ThemedText style={styles.description}>
              Track your daily cigarette consumption with ease. Monitor your habits, set goals, and visualize your progress over time.
            </ThemedText>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <ThemedText style={styles.featureIcon}>📊</ThemedText>
              <ThemedText style={styles.featureText}>Track daily consumption</ThemedText>
            </View>
            <View style={styles.feature}>
              <ThemedText style={styles.featureIcon}>📈</ThemedText>
              <ThemedText style={styles.featureText}>View trends and analytics</ThemedText>
            </View>
            <View style={styles.feature}>
              <ThemedText style={styles.featureIcon}>💰</ThemedText>
              <ThemedText style={styles.featureText}>Monitor spending</ThemedText>
            </View>
            <View style={styles.feature}>
              <ThemedText style={styles.featureIcon}>🎯</ThemedText>
              <ThemedText style={styles.featureText}>Set and achieve goals</ThemedText>
            </View>
          </View>
        </View>

        {/* Get Started Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.getStartedText}>Get Started</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}
