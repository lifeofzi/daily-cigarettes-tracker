import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO, isSameDay } from 'date-fns';

const STORAGE_KEY = '@DailyCigs:logs';
const GOAL_KEY = '@DailyCigs:dailyGoal';
const COST_KEY = '@DailyCigs:cigaretteCost';
const CURRENCY_KEY = '@DailyCigs:currency';
const HAS_SEEN_WELCOME_KEY = '@DailyCigs:hasSeenWelcome';
const DEFAULT_GOAL = 0;
const DEFAULT_COST = 0;

export interface CigaretteLog {
  id: string;
  timestamp: string; // ISO string format
}

// Save logs to storage
export const saveLogs = async (logs: CigaretteLog[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving logs:', error);
    throw error;
  }
};

// Get all logs from storage
export const getLogs = async (): Promise<CigaretteLog[]> => {
  try {
    const logs = await AsyncStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error getting logs:', error);
    return [];
  }
};

// Add a new log
export const addLog = async (log?: CigaretteLog): Promise<CigaretteLog[]> => {
  try {
    const logs = await getLogs();
    const newLog: CigaretteLog =
      log ??
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
    const updatedLogs = [...logs, newLog];
    await saveLogs(updatedLogs);
    return updatedLogs;
  } catch (error) {
    console.error('Error adding log:', error);
    throw error;
  }
};

// Remove a log by ID
export const removeLog = async (id: string): Promise<CigaretteLog[]> => {
  try {
    const logs = await getLogs();
    const updatedLogs = logs.filter(log => log.id !== id);
    await saveLogs(updatedLogs);
    return updatedLogs;
  } catch (error) {
    console.error('Error removing log:', error);
    throw error;
  }
};

// Get logs for a specific date
export const getLogsForDate = async (date: Date): Promise<CigaretteLog[]> => {
  try {
    const logs = await getLogs();
    return logs.filter(log => isSameDay(parseISO(log.timestamp), date));
  } catch (error) {
    console.error('Error getting logs for date:', error);
    return [];
  }
};

// Get logs grouped by day for the last N days
export const getLogsByDay = async (days: number): Promise<{date: Date; count: number}[]> => {
  try {
    const logs = await getLogs();
    const result: {[key: string]: number} = {};
    
    // Initialize last N days with 0 counts
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const dateKey = format(new Date(today.getTime() - (i * 24 * 60 * 60 * 1000)), 'yyyy-MM-dd');
      result[dateKey] = 0;
    }
    
    // Count logs for each day
    logs.forEach(log => {
      const dateKey = format(parseISO(log.timestamp), 'yyyy-MM-dd');
      if (result.hasOwnProperty(dateKey)) {
        result[dateKey]++;
      }
    });
    
    // Convert to array of objects with date and count
    return Object.entries(result).map(([dateKey, count]) => ({
      date: new Date(dateKey),
      count,
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    console.error('Error getting logs by day:', error);
    return [];
  }
};

export const getDailyGoal = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(GOAL_KEY);
    return value ? parseInt(value, 10) || DEFAULT_GOAL : DEFAULT_GOAL;
  } catch (error) {
    console.error('Error getting daily limit:', error);
    return DEFAULT_GOAL;
  }
};

export const setDailyGoal = async (goal: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(GOAL_KEY, goal.toString());
  } catch (error) {
    console.error('Error saving daily limit:', error);
    throw error;
  }
};

export const getCigaretteCost = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(COST_KEY);
    return value ? parseFloat(value) || DEFAULT_COST : DEFAULT_COST;
  } catch (error) {
    console.error('Error getting cigarette cost:', error);
    return DEFAULT_COST;
  }
};

export const setCigaretteCost = async (cost: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(COST_KEY, cost.toString());
  } catch (error) {
    console.error('Error saving cigarette cost:', error);
    throw error;
  }
};

export const getCurrency = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(CURRENCY_KEY);
  } catch (error) {
    console.error('Error getting currency:', error);
    return null;
  }
};

export const setCurrency = async (currency: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENCY_KEY, currency);
  } catch (error) {
    console.error('Error saving currency:', error);
    throw error;
  }
};

export const hasSeenWelcome = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking welcome status:', error);
    return false;
  }
};

export const setHasSeenWelcome = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
  } catch (error) {
    console.error('Error saving welcome status:', error);
    throw error;
  }
};

export const resetWelcome = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HAS_SEEN_WELCOME_KEY);
  } catch (error) {
    console.error('Error resetting welcome status:', error);
    throw error;
  }
};
