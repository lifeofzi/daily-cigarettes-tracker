import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getDailyGoal, setDailyGoal, getCigaretteCost, setCigaretteCost } from '@/utils/storage';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('0');
  const [costValue, setCostValue] = useState('0.00');
  const [isLoading, setIsLoading] = useState(true);
  const currency = Localization.getLocales()[0]?.currencyCode || 'USD';
  
  // Currency symbol mapping (fallback for React Native compatibility)
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    RUB: '₽',
    BRL: 'R$',
    MXN: '$',
    ZAR: 'R',
    TRY: '₺',
    KRW: '₩',
    SGD: 'S$',
    HKD: 'HK$',
    NZD: 'NZ$',
  };
  
  const currencySymbol = currencySymbols[currency] || '$';

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedGoal, storedCost] = await Promise.all([
          getDailyGoal(),
          getCigaretteCost(),
        ]);
        setInputValue(String(storedGoal));
        setCostValue(storedCost > 0 ? storedCost.toFixed(2) : '0.00');
      } catch (error) {
        console.error('Error loading settings', error);
        Alert.alert('Error', 'Unable to load your settings right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
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
              <ThemedText style={styles.sectionTitle}>{t('settings.dailyLimit')}</ThemedText>
              <ThemedText style={styles.sectionDescription}>
                {t('settings.dailyLimitDescription')}
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
                  placeholder="0"
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
              <ThemedText style={styles.sectionTitle}>{t('settings.cigaretteCost')}</ThemedText>
              <ThemedText style={styles.sectionDescription}>
                {t('settings.cigaretteCostDescription')}
              </ThemedText>

              <View style={styles.costInputContainer}>
                <ThemedText style={styles.currencySymbol}>{currencySymbol}</ThemedText>
                <TextInput
                  value={costValue}
                  keyboardType="decimal-pad"
                  onChangeText={(text) => {
                    // Allow numbers and one decimal point
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    if (parts.length > 2) return; // Only allow one decimal point
                    if (parts[1] && parts[1].length > 2) return; // Max 2 decimal places
                    setCostValue(cleaned || '0.00');
                  }}
                  onBlur={async () => {
                    const parsedCost = parseFloat(costValue) || 0;
                    const formatted = parsedCost.toFixed(2);
                    setCostValue(formatted);
                    try {
                      await setCigaretteCost(parsedCost);
                    } catch (error) {
                      console.error('Error saving cost', error);
                      Alert.alert('Error', 'Unable to save the cost. Please try again.');
                    }
                  }}
                  style={styles.costInput}
                  maxLength={10}
                  textAlign="left"
                  placeholder="0.00"
                />
              </View>
            </View>

            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}>{t('settings.whySetGoal')}</ThemedText>
              <ThemedText style={styles.sectionDescription}>
                {t('settings.whySetGoalDescription')}
              </ThemedText>
            </View>

            <View style={styles.card}>
              <ThemedText style={styles.sectionTitle}>Support the App</ThemedText>
              <ThemedText style={styles.sectionDescription}>
                If you find this app helpful, consider supporting its development with a coffee! ☕
              </ThemedText>
              
              <View style={styles.bmcContainer}>
                <Image
                  source={require('@/assets/images/bmc_qr.png')}
                  style={styles.bmcQR}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.bmcButton}
                  onPress={() => Linking.openURL('https://buymeacoffee.com/zaman_ishtiyaq')}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.bmcButtonText}>Buy Me a Coffee</ThemedText>
                </TouchableOpacity>
              </View>
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
  costInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f5f7',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 24,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3f51b5',
    marginRight: 8,
  },
  costInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#3f51b5',
  },
  bmcContainer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 20,
  },
  bmcQR: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  bmcButton: {
    backgroundColor: '#FFDD00',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bmcButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});

