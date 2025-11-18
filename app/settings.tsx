import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOAL_KEY = '@DailyCigs:dailyGoal';
const NOTIFICATIONS_KEY = '@DailyCigs:notificationsEnabled';

export default function SettingsScreen() {
  const [dailyGoal, setDailyGoal] = useState('10');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedGoal, notifications] = await Promise.all([
        AsyncStorage.getItem(GOAL_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_KEY)
      ]);
      
      if (savedGoal) setDailyGoal(savedGoal);
      setNotificationsEnabled(notifications === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await Promise.all([
        AsyncStorage.setItem(GOAL_KEY, dailyGoal),
        AsyncStorage.setItem(NOTIFICATIONS_KEY, notificationsEnabled.toString())
      ]);
      router.back();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3f51b5" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Settings</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Daily Goal</ThemedText>
        <View style={styles.settingRow}>
          <ThemedText style={styles.settingLabel}>Target cigarettes per day</ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={dailyGoal}
              onChangeText={setDailyGoal}
              maxLength={2}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
        <View style={styles.settingRow}>
          <ThemedText style={styles.settingLabel}>Enable reminders</ThemedText>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#e0e0e0', true: '#b3c6ff' }}
            thumbColor={notificationsEnabled ? '#3f51b5' : '#f4f3f4'}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={saveSettings}
        disabled={isSaving}
      >
        <ThemedText style={styles.saveButtonText}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#222',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  inputContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    minWidth: 50,
  },
  saveButton: {
    backgroundColor: '#3f51b5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
