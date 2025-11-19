import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { format, subDays, addDays, isToday, isThisWeek, isThisMonth, eachDayOfInterval, startOfDay } from 'date-fns';
import { getLogsByDay, CigaretteLog, getLogs } from '@/utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DailyData {
  date: Date;
  count: number;
}

interface ChartDataPoint {
  value: number | undefined;
  label?: string;
  labelTextStyle?: any;
  dataPointText?: string;
}

export default function TrendsScreen() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [xAxisLabels, setXAxisLabels] = useState<string[]>([]);
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

      // Find today's index
      const todayIndex = filledData.findIndex(item => 
        item.date.toDateString() === startOfDay(today).toDateString()
      );
      
      // Generate chart data points
      // For month view: include all days (with undefined values after today to stop the line)
      // For week view: include all data
      const chartDataPoints: ChartDataPoint[] = filledData.map((item, index) => {
        const isAfterToday = timeRange === 'month' && index > todayIndex && todayIndex !== -1;
        
        return {
          value: isAfterToday ? undefined : item.count, // undefined stops the line
          label: index === 0 || index === filledData.length - 1 || (timeRange === 'week' && index % 2 === 0)
            ? showLabel(item.date, index)
            : '',
          labelTextStyle: {
            color: '#666',
            fontSize: 10,
          },
        };
      });
      
      // Generate x-axis labels (for display)
      const labels = filledData.map((item, index) => showLabel(item.date, index));
      
      setChartData(chartDataPoints);
      setXAxisLabels(labels);

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
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 50;
  const chartHeight = 220;

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
              spacing={timeRange === 'week' ? 40 : 8}
              thickness={3}
              color="#3f51b5"
              hideRules={false}
              rulesType="solid"
              rulesColor="rgba(200, 200, 200, 0.5)"
              rulesThickness={1}
              hideYAxisText={false}
              yAxisColor="#3f51b5"
              xAxisColor="#3f51b5"
              yAxisThickness={1}
              xAxisThickness={1}
              curved
              areaChart={false}
              startFillColor="#3f51b5"
              endFillColor="#3f51b5"
              startOpacity={0.15}
              endOpacity={0}
              textShiftY={-2}
              textShiftX={-5}
              textFontSize={10}
              textColor="#666"
              hideDataPoints={false}
              dataPointsColor="#3f51b5"
              dataPointsRadius={5}
              dataPointsWidth={2}
              maxValue={chartData.length > 0 
                ? Math.max(...chartData.filter(d => d.value !== undefined).map(d => d.value as number), 0) + 1
                : 4}
              yAxisTextStyle={{ color: '#666', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#666', fontSize: 10 }}
              noOfSections={4}
              yAxisLabelPrefix=""
              yAxisLabelSuffix=""
              initialSpacing={0}
              endSpacing={0}
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
