import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { format, subDays, isToday, isThisWeek, isThisMonth, eachDayOfInterval, startOfDay } from 'date-fns';
import { getLogsByDay, getCigaretteCost, getCurrency } from '@/utils/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Localization from 'expo-localization';

interface ChartDataPoint {
  value: number | undefined;
  label?: string;
  labelTextStyle?: any;
}

interface DailySpending {
  date: Date;
  count: number;
  amount: number;
}

const CURRENCY_SYMBOLS: { [key: string]: string } = {
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

export default function CostsScreen() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cigaretteCost, setCigaretteCost] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [stats, setStats] = useState({
    totalSpent: 0,
    dailyAverage: 0,
    totalCigarettes: 0,
  });

  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [cost, storedCurrency] = await Promise.all([
        getCigaretteCost(),
        getCurrency(),
      ]);
      
      setCigaretteCost(cost);
      const defaultCurrency = Localization.getLocales()[0]?.currencyCode || 'USD';
      setCurrency(storedCurrency || defaultCurrency);

      if (cost === 0) {
        setChartData([]);
        setStats({
          totalSpent: 0,
          dailyAverage: 0,
          totalCigarettes: 0,
        });
        setIsLoading(false);
        return;
      }

      const days = timeRange === 'week' ? 7 : 30;
      const logsByDay = await getLogsByDay(days);
      
      const today = new Date();
      const startDate = subDays(today, days - 1);
      const endDate = startOfDay(today);
      
      const allDays = eachDayOfInterval({
        start: startOfDay(startDate),
        end: endDate
      });

      const spendingData: DailySpending[] = allDays.map(day => {
        const existing = logsByDay.find(d => 
          d.date.toDateString() === day.toDateString()
        );
        const count = existing ? existing.count : 0;
        return {
          date: day,
          count,
          amount: count * cost,
        };
      });

      // Calculate statistics
      const periodData = timeRange === 'week' 
        ? spendingData.filter(d => isThisWeek(d.date))
        : spendingData.filter(d => isThisMonth(d.date));
      
      const totalSpent = periodData.reduce((sum, day) => sum + day.amount, 0);
      const totalCigarettes = periodData.reduce((sum, day) => sum + day.count, 0);
      const dailyAverage = periodData.length > 0 ? totalSpent / periodData.length : 0;

      // Generate chart data
      const chartDataPoints: ChartDataPoint[] = spendingData.map((item, index) => {
        return {
          value: item.amount,
          label: index === 0 || index === spendingData.length - 1 || (timeRange === 'week' && index % 2 === 0)
            ? (timeRange === 'week' 
                ? format(item.date, 'EEE').charAt(0)
                : (index === 0 || index === spendingData.length - 1 ? format(item.date, 'MMM d') : ''))
            : '',
          labelTextStyle: {
            color: '#666',
            fontSize: 10,
          },
        };
      });

      setChartData(chartDataPoints);
      setStats({
        totalSpent,
        dailyAverage,
        totalCigarettes,
      });
    } catch (error) {
      console.error('Error loading cost data:', error);
      Alert.alert('Error', 'Failed to load cost data');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 50;
  const chartHeight = 220;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </ThemedView>
    );
  }

  if (cigaretteCost === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>No Cost Set</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Please set the cost of a cigarette in Settings to view spending statistics.
            </ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
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
                curved={false}
                areaChart={false}
                hideDataPoints={false}
                dataPointsColor="#3f51b5"
                dataPointsRadius={5}
                dataPointsWidth={2}
                maxValue={(() => {
                  const validValues = chartData.filter(d => d.value !== undefined && d.value !== null).map(d => Math.max(0, d.value as number));
                  if (validValues.length === 0) return 100;
                  const max = Math.max(...validValues, 0);
                  return Math.ceil(max) + (max > 0 ? Math.ceil(max * 0.2) : 0);
                })()}
                mostNegativeValue={0}
                yAxisTextStyle={{ color: '#666', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: '#666', fontSize: 10 }}
                noOfSections={4}
                yAxisLabelPrefix={currencySymbol}
                yAxisLabelSuffix=""
                initialSpacing={10}
                endSpacing={10}
                yAxisOffset={0}
              />
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
              <ThemedText style={styles.statValue}>
                {currencySymbol}{stats.totalSpent.toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.statHint}>
                This {timeRange === 'week' ? 'Week' : 'Month'}
              </ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statLabel}>Daily Average</ThemedText>
              <ThemedText style={styles.statValue}>
                {currencySymbol}{stats.dailyAverage.toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.statHint}>
                Per day
              </ThemedText>
            </View>
          </View>

          <View style={styles.card}>
            <ThemedText style={styles.sectionTitle}>Summary</ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Cigarettes:</ThemedText>
              <ThemedText style={styles.summaryValue}>{stats.totalCigarettes}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Cost per cigarette:</ThemedText>
              <ThemedText style={styles.summaryValue}>{currencySymbol}{cigaretteCost.toFixed(2)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Total amount:</ThemedText>
              <ThemedText style={styles.summaryValue}>{currencySymbol}{stats.totalSpent.toFixed(2)}</ThemedText>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
});

