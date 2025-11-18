import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { format, isToday } from 'date-fns';
import { addLog, removeLog, getLogsForDate, getLogsByDay, CigaretteLog } from '@/utils/storage';

export default function HomeScreen() {
    const [count, setCount] = useState(0);
  const [todayLogs, setTodayLogs] = useState<CigaretteLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load today's logs on component mount
  useEffect(() => {
    const loadTodayLogs = async () => {
      try {
        const logs = await getLogsForDate(new Date());
        setTodayLogs(logs);
        setCount(logs.length);

        // Calculate time-based stats
        const timeStats = {
          morning: 0,
          afternoon: 0,
          evening: 0,
          night: 0
        };

        logs.forEach(log => {
          const timeOfDay = getTimeOfDay(new Date(log.timestamp));
          timeStats[timeOfDay]++;
        });

        setTimeStats(timeStats);
      } catch (error) {
        console.error('Error loading logs:', error);
        Alert.alert('Error', 'Failed to load your smoking data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTodayLogs();
  }, []);

  const updateTimeStats = (logs: CigaretteLog[]) => {
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
  };

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
            style={[styles.actionButton, styles.addButton]}
            onPress={addCigarette}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.actionButtonText}>+</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => count > 0 && removeCigarette(todayLogs[todayLogs.length - 1]?.id)}
            activeOpacity={0.8}
            disabled={count === 0}
          >
            <ThemedText style={styles.actionButtonText}>−</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

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
  removeText: {
    color: '#f44336',
  },
});
