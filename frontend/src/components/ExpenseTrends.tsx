import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { billsService, ExpenseTrends } from '../services/bills.service';
import { formatCurrency } from '../utils/format';
import { useTheme } from '../context/ThemeContext';

export const ExpenseTrendsComponent: React.FC = () => {
  const [trends, setTrends] = useState<ExpenseTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await billsService.getExpenseTrends();
        setTrends(data);
      } catch (err) {
        setError('Failed to load expense trends');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: theme.text }]}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: theme.error }]}>{error}</Text>
      </View>
    );
  }

  if (!trends) {
    return null;
  }

  const dailyData = {
    labels: Object.keys(trends.daily),
    datasets: [
      {
        data: Object.values(trends.daily),
        color: (opacity = 1) => theme.primary,
        strokeWidth: 2,
      },
    ],
  };

  const weeklyData = {
    labels: Object.keys(trends.weekly),
    datasets: [
      {
        data: Object.values(trends.weekly),
        color: (opacity = 1) => theme.secondary,
        strokeWidth: 2,
      },
    ],
  };

  const monthlyData = {
    labels: Object.keys(trends.monthly),
    datasets: [
      {
        data: Object.values(trends.monthly),
        color: (opacity = 1) => theme.info,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.background,
    backgroundGradientTo: theme.background,
    color: (opacity = 1) => theme.text,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={[styles.title, { color: theme.text }]}>Daily Trends</Text>
        <LineChart
          data={dailyData}
          width={350}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: theme.text }]}>Weekly Trends</Text>
        <LineChart
          data={weeklyData}
          width={350}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: theme.text }]}>Monthly Trends</Text>
        <LineChart
          data={monthlyData}
          width={350}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 