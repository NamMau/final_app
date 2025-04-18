import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { billsService, ExpenseSummary } from '../services/bills.service';
import { formatCurrency } from '../utils/format';
import { useTheme } from '../context/ThemeContext';

export const ExpenseSummaryComponent: React.FC = () => {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await billsService.getExpenseSummary();
        setSummary(data);
      } catch (err) {
        setError('Failed to load expense summary');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
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

  if (!summary) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={[styles.title, { color: theme.text }]}>Total Expenses</Text>
        <Text style={[styles.amount, { color: theme.primary }]}>
          {formatCurrency(summary.total)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: theme.text }]}>By Category</Text>
        {Object.entries(summary.byCategory).map(([categoryId, amount]) => (
          <View key={categoryId} style={styles.categoryItem}>
            <Text style={[styles.text, { color: theme.text }]}>{categoryId}</Text>
            <Text style={[styles.amount, { color: theme.primary }]}>
              {formatCurrency(amount)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: theme.text }]}>By Date</Text>
        {Object.entries(summary.byDate).map(([date, amount]) => (
          <View key={date} style={styles.dateItem}>
            <Text style={[styles.text, { color: theme.text }]}>{date}</Text>
            <Text style={[styles.amount, { color: theme.primary }]}>
              {formatCurrency(amount)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: theme.text }]}>By Type</Text>
        {Object.entries(summary.byType).map(([type, amount]) => (
          <View key={type} style={styles.typeItem}>
            <Text style={[styles.text, { color: theme.text }]}>{type}</Text>
            <Text style={[styles.amount, { color: theme.primary }]}>
              {formatCurrency(amount)}
            </Text>
          </View>
        ))}
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
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  typeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
}); 