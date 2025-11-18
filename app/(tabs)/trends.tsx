import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { format, subDays, isToday, isThisWeek, isThisMonth, eachDayOfInterval, startOfDay } from 'date-fns';
import { getLogsByDay, CigaretteLog, getLogs } from '@/utils/storage';

interface DailyData {
  date: Date;
  count: number;
}

export default function TrendsScreen() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [{
      data: [] as number[],
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
      strokeWidth: 2
    }]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    dailyAverage: 0,
    total: 0,
    changeFromLastPeriod: 0
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const days = timeRange === 'week' ? 7 : 30;
      const logsByDay = await getLogsByDay(days);
      
      // Ensure we have data for all days in the range
      const today = new Date();
      const startDate = subDays(today, days - 1);
      const allDays = eachDayOfInterval({
        start: startOfDay(startDate),
        end: startOfDay(today)
      });

      const filledData = allDays.map(day => {
        const existing = logsByDay.find(d => 
          d.date.toDateString() === day.toDateString()
        );
        return {
          date: day,
          count: existing ? existing.count : 0
        };
      });

      // Calculate statistics
      const periodData = timeRange === 'week' ? 
        filledData.filter(d => isThisWeek(d.date)) :
        filledData.filter(d => isThisMonth(d.date));
        
      const total = periodData.reduce((sum, day) => sum + day.count, 0);
      const dailyAverage = periodData.length > 0 ? (total / periodData.length).toFixed(1) : 0;
      
      // Simple change calculation (in a real app, compare with previous period)
      const changeFromLastPeriod = 0; // You can implement this based on your needs

      // For month view, only show every 5th day label to prevent overlap
      const showLabel = timeRange === 'week' 
        ? (date: Date) => format(date, 'MMM d')
        : (date: Date, index: number) => index % 5 === 0 ? format(date, 'MMM d') : '';

      setChartData({
        labels: filledData.map((item, index) => showLabel(item.date, index)),
        datasets: [{
          data: filledData.map(item => item.count),
          color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`, // Darker blue
          strokeWidth: 5, // Even thicker line
          withDots: false,
          withShadow: false,
          withVerticalLines: false,
          withHorizontalLines: false,
          lineTension: 0.3, // Slight curve for better visibility
        }]
      });

      setStats({
        dailyAverage: Number(dailyAverage),
        total,
        changeFromLastPeriod
      });
    } catch (error) {
      console.error('Error loading trend data:', error);
      Alert.alert('Error', 'Failed to load trend data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when time range changes
  useEffect(() => {
    loadData();
  }, [timeRange]);

  // Set up an interval to check for data changes
  useEffect(() => {
    // Check for data changes every 2 seconds
    const interval = setInterval(async () => {
      const logs = await getLogs();
      const todayLogs = logs.filter(log => isToday(new Date(log.timestamp)));
      if (todayLogs.length !== stats.total) {
        loadData();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [stats.total]);

  // Color theme: Indigo primary with teal accent
  const theme = {
    primary: '#3f51b5',    // Indigo 500
    primaryLight: '#757de8',
    primaryDark: '#002984',
    accent: '#00bcd4',     // Teal 400
    background: '#f8f9fa', // Light gray background
    surface: '#ffffff',    // White surface
    text: '#212121',       // Dark gray text
    secondaryText: '#757575', // Light gray text
  };

  // Chart dimensions
  const chartWidth = Dimensions.get('window').width - 40;
  const chartHeight = 200;

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: () => '#3f51b5',
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: null,
    fillShadowGradient: '#3f51b5',
    fillShadowGradientOpacity: 0.1,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeWidth: 0.5,
      stroke: 'rgba(0, 0, 0, 0.05)',
    },
    propsForLabels: {
      fontSize: 10,
      fill: '#888',
      fontFamily: 'System',
    },
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForLabels: {
      fontSize: 10
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.dateText}>
            {format(new Date(), 'EEEE, MMMM d')}
          </ThemedText>
          <ThemedText style={styles.screenTitle}>Trends</ThemedText>
        </View>

        <View style={styles.timeRangePill}>
          <TouchableOpacity
            style={[
              styles.timeRangeOption,
              timeRange === 'week' && styles.timeRangeOptionActive
            ]}
            onPress={() => setTimeRange('week')}
            activeOpacity={0.9}
          >
            <ThemedText style={[
              styles.timeRangeText,
              timeRange === 'week' && styles.timeRangeTextActive
            ]}>
              Week
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeRangeOption,
              timeRange === 'month' && styles.timeRangeOptionActive
            ]}
            onPress={() => setTimeRange('month')}
            activeOpacity={0.9}
          >
            <ThemedText style={[
              styles.timeRangeText,
              timeRange === 'month' && styles.timeRangeTextActive
            ]}>
              Month
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.chart}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={chartConfig}
              bezier
              withDots={false}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={false}
              withShadow={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={4}
              fromZero
              formatXLabel={(value, index) => {
                if (!value) return '';
                return timeRange === 'month' ? value.split(' ')[1] : value.substring(0, 1);
              }}
              getDotColor={() => 'transparent'}
              style={{
                marginVertical: 8,
                marginLeft: -10,
              }}
            />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <ThemedText style={styles.statLabel}>Daily Average</ThemedText>
            <ThemedText style={styles.statValue}>{stats.dailyAverage}</ThemedText>
            <ThemedText style={[
              styles.statChange,
              stats.changeFromLastPeriod >= 0 ? styles.negative : styles.positive
            ]}>
              {stats.changeFromLastPeriod >= 0 ? '↑' : '↓'} {Math.abs(stats.changeFromLastPeriod)} from last {timeRange}
            </ThemedText>
          </View>
          <View style={styles.statBox}>
            <ThemedText style={styles.statLabel}>
              This {timeRange === 'week' ? 'Week' : 'Month'}
            </ThemedText>
            <ThemedText style={styles.statValue}>{stats.total}</ThemedText>
            <ThemedText style={styles.statHint}>
              {timeRange === 'week' ? 'Last 7 days' : 'Last 30 days'}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
  timeRangePill: {
    flexDirection: 'row',
    backgroundColor: '#eceff5',
    borderRadius: 999,
    padding: 4,
    marginBottom: 20,
  },
  timeRangeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  timeRangeOptionActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#3f51b5',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  chart: {
    marginLeft: -10,
    marginRight: -10,
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 10,
  },
  statBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flex: 1,
    minWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3f51b5',
  },
  statHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
  },
  statChange: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#f44336',
  },
});
