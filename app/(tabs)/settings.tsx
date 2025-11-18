import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getDailyGoal, setDailyGoal } from '@/utils/storage';

export default function SettingsScreen() {
  const [inputValue, setInputValue] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const storedGoal = await getDailyGoal();
        setInputValue(String(storedGoal));
      } catch (error) {
        console.error('Error loading goal', error);
        Alert.alert('Error', 'Unable to load your goal right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadGoal();
  }, []);

  const adjustGoal = async (delta: number) => {
    const current = parseInt(inputValue.replace(/[^0-9]/g, ''), 10) || 0;
    const next = Math.max(0, current + delta);
    setInputValue(String(next));
    
    // Auto-save immediately
    try {
      await setDailyGoal(next);
    } catch (error) {
      console.error('Error saving goal', error);
      Alert.alert('Error', 'Unable to save your goal. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Daily Goal</ThemedText>
              <ThemedText style={styles.sectionDescription}>
                Set the number of cigarettes you aim to stay under each day.
              </ThemedText>

              <View style={styles.goalRow}>
                <TouchableOpacity
                  style={[styles.adjustButton, styles.minusButton]}
                  onPress={() => adjustGoal(-1)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.adjustButtonText}>−</ThemedText>
                </TouchableOpacity>

                <TextInput
                  value={inputValue}
                  keyboardType="number-pad"
                  onChangeText={(text) => {
                    setInputValue(text.replace(/[^0-9]/g, ''));
                  }}
                  onBlur={async () => {
                    const parsedGoal = parseInt(inputValue, 10) || 0;
                    try {
                      await setDailyGoal(parsedGoal);
                    } catch (error) {
                      console.error('Error saving goal', error);
                      Alert.alert('Error', 'Unable to save your goal. Please try again.');
                    }
                  }}
                  style={styles.goalInput}
                  maxLength={3}
                  textAlign="center"
                />

                <TouchableOpacity
                  style={[styles.adjustButton, styles.plusButton]}
                  onPress={() => adjustGoal(1)}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.adjustButtonText}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Why set a goal?</ThemedText>
              <ThemedText style={styles.sectionDescription}>
                Having a clear target helps you track your progress and stay motivated. Update your
                goal anytime you need a fresh challenge.
              </ThemedText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  goalInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '700',
    color: '#3f51b5',
    backgroundColor: '#f4f5f7',
    borderRadius: 16,
    paddingVertical: 12,
  },
  adjustButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  minusButton: {
    backgroundColor: '#f44336',
    opacity: 0.85,
  },
  plusButton: {
    backgroundColor: '#4CAF50',
  },
  adjustButtonText: {
    fontSize: 36,
    color: '#fff',
    lineHeight: 36,
    textAlign: 'center',
    includeFontPadding: false,
  },
});

