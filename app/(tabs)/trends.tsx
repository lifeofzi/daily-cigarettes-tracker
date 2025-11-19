import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { format, subDays, addDays, isToday, isThisWeek, isThisMonth, eachDayOfInterval, startOfDay } from 'date-fns';
import { getLogsByDay, CigaretteLog, getLogs } from '@/utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
      strokeWidth: 2
    }]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    dailyAverage: 0,
    total: 0,
    changeFromLastPeriod: 0
  });
  const seenYLabels = useRef<Set<number>>(new Set());

  const loadData = async () => {
    try {
      setIsLoading(true);
      const days = timeRange === 'week' ? 7 : 30;
      const logsByDay = await getLogsByDay(days);
      
      // Ensure we have data for all days in the range
      const today = new Date();
      const startDate = subDays(today, days - 1);
      
      // For month view, extend 5 days into the future for spacing, but line will stop at today
      const endDate = timeRange === 'month' 
        ? addDays(today, 5) // Add 5 days for spacing
        : startOfDay(today);
      
      const allDays = eachDayOfInterval({
        start: startOfDay(startDate),
        end: startOfDay(endDate)
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

      // For week view, show day abbreviations (S, M, T, W, T, F, S)
      // For month view, show month names at transitions and day numbers otherwise
      const dayAbbrev: { [key: string]: string } = {
        'Sunday': 'S',
        'Monday': 'M',
        'Tuesday': 'T',
        'Wednesday': 'W',
        'Thursday': 'T',
        'Friday': 'F',
        'Saturday': 'S'
      };
      
      const showLabel = timeRange === 'week' 
        ? (date: Date) => dayAbbrev[format(date, 'EEEE')] || format(date, 'EEEEEE')
        : (date: Date, index: number) => {
            // For month view, only show start date and end date
            const totalDays = filledData.length;
            if (index === 0) {
              // Start date: show month and day (e.g., "Oct 25")
              return format(date, 'MMM d');
            }
            if (index === totalDays - 1) {
              // End date (future date for spacing): show month and day (e.g., "Nov 29")
              return format(date, 'MMM d');
            }
            // All other labels are empty
            return '';
          };

      // Reset seen Y-axis labels for new chart data
      seenYLabels.current.clear();
      
      // Find today's index
      const todayIndex = filledData.findIndex(item => 
        item.date.toDateString() === startOfDay(today).toDateString()
      );
      
      // For month view, only include data up to today (stop the line at today)
      // For week view, include all data
      const dataEndIndex = timeRange === 'month' && todayIndex !== -1 
        ? todayIndex + 1  // Include today, stop here
        : filledData.length;
      
      // Slice data to only include up to today for month view
      const dataToUse = filledData.slice(0, dataEndIndex);
      
      // Generate labels only for the data we're using (line stops at today)
      const allLabels = dataToUse.map((item, index) => showLabel(item.date, index));
      
      // Generate data values - only actual data up to today
      const chartDataValues = dataToUse.map(item => item.count);
      
      setChartData({
        labels: allLabels,
        datasets: [{
          data: chartDataValues,
          color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
          strokeWidth: 3,
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

  // Chart dimensions - maximize space, minimal padding
  // Screen width minus: screen padding (40px) + minimal card padding (10px total) = 50px
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 50;
  const chartHeight = 220;

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(63, 81, 181, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    fillShadowGradient: '#3f51b5',
    fillShadowGradientOpacity: 0.15,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeWidth: 1,
      strokeDasharray: [5, 5],
      stroke: 'rgba(200, 200, 200, 0.5)',
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#ffffff',
    },
    propsForLabels: {
      fontSize: 10,
      fill: '#666',
      fontFamily: 'System',
    },
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16
    }
  } as const;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              withDots={true}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              withShadow={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={4}
              fromZero
              formatXLabel={(value: string) => {
                if (!value) return '';
                if (timeRange === 'week') {
                  // Return first letter of day name
                  return value.charAt(0).toUpperCase();
                }
                // For month view, return the value as-is (already formatted as month name or day number)
                return value;
              }}
              formatYLabel={(value: string) => {
                // Format Y-axis labels to show integers only, prevent duplicates
                const numValue = parseFloat(value);
                if (isNaN(numValue)) return value;
                const rounded = Math.round(numValue);
                
                // Check if we've already shown this value
                if (seenYLabels.current.has(rounded)) {
                  return ''; // Return empty string for duplicates
                }
                
                // Mark this value as seen and return it
                seenYLabels.current.add(rounded);
                return rounded.toString();
              }}
              getDotColor={() => '#3f51b5'}
              style={{
                marginVertical: -5,
                marginLeft: -25,
                marginRight: 0,
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 20,
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
    paddingTop: 5,
    paddingBottom: 5,
    paddingHorizontal: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  chart: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginTop: 0,
    marginBottom: 0,
    overflow: 'hidden',
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
    lineHeight: 36,
    includeFontPadding: false,
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
