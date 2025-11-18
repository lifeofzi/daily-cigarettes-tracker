import { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { format, isToday } from 'date-fns';
import { addLog, removeLog, getLogsForDate, getLogsByDay, CigaretteLog, getDailyGoal } from '@/utils/storage';

export default function HomeScreen() {
    const router = useRouter();
    const [count, setCount] = useState(0);
  const [todayLogs, setTodayLogs] = useState<CigaretteLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [timeStats, setTimeStats] = useState({
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  });

  const getTimeOfDay = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const updateTimeStats = useCallback((logs: CigaretteLog[]) => {
    const newTimeStats = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    };

    logs.forEach(log => {
      const timeOfDay = getTimeOfDay(new Date(log.timestamp));
      newTimeStats[timeOfDay]++;
    });

    setTimeStats(newTimeStats);
  }, []);

  const loadTodayData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [logs, goal] = await Promise.all([
        getLogsForDate(new Date()),
        getDailyGoal(),
      ]);

      setTodayLogs(logs);
      setCount(logs.length);
      updateTimeStats(logs);
      setDailyGoal(goal);
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'Failed to load your smoking data');
    } finally {
      setIsLoading(false);
    }
  }, [updateTimeStats]);

  useFocusEffect(
    useCallback(() => {
      loadTodayData();
    }, [loadTodayData])
  );

  const addCigarette = async () => {
    try {
      const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      await addLog(newLog);
      const updatedLogs = [...todayLogs, newLog];
      setTodayLogs(updatedLogs);
      setCount(updatedLogs.length);
      updateTimeStats(updatedLogs);
    } catch (error) {
      console.error('Error adding log:', error);
      Alert.alert('Error', 'Failed to add cigarette log');
    }
  };

  const removeCigarette = async (id: string) => {
    try {
      await removeLog(id);
      const updatedLogs = todayLogs.filter(log => log.id !== id);
      setTodayLogs(updatedLogs);
      setCount(updatedLogs.length);
      updateTimeStats(updatedLogs);
    } catch (error) {
      console.error('Error removing log:', error);
      Alert.alert('Error', 'Failed to remove cigarette log');
    }
  };

  const goalProgress = dailyGoal > 0 ? Math.min(count / dailyGoal, 1) : 0;
  const hasExceeded = dailyGoal > 0 && count > dailyGoal;
  const remaining = Math.max(dailyGoal - count, 0);
  const emberOffset = Math.min(goalProgress * 100, 98);

  const handleNavigateToSettings = () => {
    router.push('/(tabs)/settings');
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <ThemedText style={styles.dateText}>
          {format(new Date(), 'EEEE, MMMM d')}
        </ThemedText>
      </View>

      <View style={styles.counterSection}>
        <ThemedText style={styles.counter}>{count}</ThemedText>
        <ThemedText style={styles.counterLabel}>cigarettes today</ThemedText>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => count > 0 && removeCigarette(todayLogs[todayLogs.length - 1]?.id)}
            activeOpacity={0.8}
            disabled={count === 0}
          >
            <ThemedText style={styles.actionButtonText}>−</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]}
            onPress={addCigarette}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.actionButtonText}>+</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {dailyGoal > 0 ? (
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <ThemedText style={styles.goalTitle}>Daily Goal</ThemedText>
            <ThemedText style={styles.goalValue}>{count} / {dailyGoal}</ThemedText>
          </View>

          <View style={styles.cigaretteWrapper}>
            <View style={styles.cigaretteFilter}>
              <View style={styles.filterTexture} />
              <View style={[styles.filterTexture2, { top: '15%', left: '20%' }]} />
              <View style={[styles.filterTexture2, { top: '35%', left: '10%' }]} />
              <View style={[styles.filterTexture2, { top: '55%', left: '30%' }]} />
              <View style={[styles.filterTexture2, { top: '75%', left: '25%' }]} />
              <View style={[styles.filterTexture3, { top: '25%', left: '50%' }]} />
              <View style={[styles.filterTexture3, { top: '45%', left: '65%' }]} />
              <View style={[styles.filterTexture3, { top: '65%', left: '55%' }]} />
            </View>
            <View style={styles.cigaretteBody}>
              <View style={[styles.cigaretteBurned, { width: `${goalProgress * 100}%` }]} />
              <View
                style={[
                  styles.cigaretteEmber,
                  { right: `${emberOffset}%`, opacity: goalProgress < 1 ? 1 : 0 },
                ]}
              />
            </View>
          </View>

          <View style={styles.goalFooter}>
            <ThemedText style={styles.goalRemaining}>
              {hasExceeded 
                ? 'No problem, we start tomorrow.' 
                : remaining > 0 
                  ? `${remaining} left` 
                  : 'Alright, lets keep it steady. No more for the day.'}
            </ThemedText>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.goalCard, styles.goalCardEmpty]}
          activeOpacity={0.9}
          onPress={handleNavigateToSettings}
        >
          <ThemedText style={styles.goalTitle}>No daily goal yet</ThemedText>
          <ThemedText style={styles.goalEmptyDescription}>
            Tap to set a limit and visualize your progress.
          </ThemedText>
          <ThemedText style={styles.goalCTA}>Open Settings</ThemedText>
        </TouchableOpacity>
      )}

      <View style={styles.timeStatsContainer}>
        <View style={styles.timeStatBox}>
          <ThemedText style={styles.timeStatValue}>{timeStats.morning}</ThemedText>
          <ThemedText style={styles.timeStatLabel}>Morning</ThemedText>
        </View>
        <View style={styles.timeStatBox}>
          <ThemedText style={styles.timeStatValue}>{timeStats.afternoon}</ThemedText>
          <ThemedText style={styles.timeStatLabel}>Afternoon</ThemedText>
        </View>
        <View style={styles.timeStatBox}>
          <ThemedText style={styles.timeStatValue}>{timeStats.evening}</ThemedText>
          <ThemedText style={styles.timeStatLabel}>Evening</ThemedText>
        </View>
        <View style={styles.timeStatBox}>
          <ThemedText style={styles.timeStatValue}>{timeStats.night}</ThemedText>
          <ThemedText style={styles.timeStatLabel}>Night</ThemedText>
        </View>
      </View>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  // Removed headerTitle style
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  counterSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  counter: {
    fontSize: 100,
    fontWeight: '700',
    color: '#3f51b5',
    marginBottom: 5,
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
    lineHeight: 100,
  },
  counterLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 20,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  removeButton: {
    backgroundColor: '#f44336',
    opacity: 0.7,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 36,
    lineHeight: 40,
    marginTop: -4,
  },
  timeStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  timeStatBox: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3f51b5',
    marginBottom: 4,
  },
  timeStatLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3f51b5',
  },
  cigaretteWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cigaretteFilter: {
    width: 70,
    height: 28,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: '#d4a574',
    borderColor: '#b8905f',
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  filterTexture: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 115, 85, 0.15)',
    borderRadius: 2,
  },
  filterTexture2: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(139, 115, 85, 0.4)',
  },
  filterTexture3: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(139, 115, 85, 0.35)',
  },
  cigaretteBody: {
    flex: 1,
    height: 24,
    marginLeft: -2,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#fdfcf7',
    borderColor: '#dadada',
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  cigaretteBurned: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#d7d7d7',
  },
  cigaretteEmber: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ff7043',
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    marginRight: -6,
  },
  goalFooter: {
    marginTop: 4,
  },
  goalRemaining: {
    fontSize: 14,
    color: '#666',
  },
  goalCardEmpty: {
    gap: 6,
  },
  goalEmptyDescription: {
    fontSize: 14,
    color: '#666',
  },
  goalCTA: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3f51b5',
    marginTop: 4,
  },
  removeText: {
    color: '#f44336',
  },
});
