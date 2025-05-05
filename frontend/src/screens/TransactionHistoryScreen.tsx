import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { transactionsService, Transaction, TransactionStats } from '../services/transactions.service';
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TransactionHistory'>;

export default function TransactionHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get start and end dates for current month
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      console.log('Fetching transactions from', startDate, 'to', endDate);

      const transactionsData = await transactionsService.getTransactions({
        startDate,
        endDate
      });
      
      console.log('Transactions loaded:', transactionsData);
      console.log('Number of transactions:', transactionsData.length);
      
      // Set transactions state with the data
      setTransactions(transactionsData || []);
      
      if (transactionsData.length === 0) {
        console.log('No transactions found for the selected period');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setTransactions([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.billName}>{item.bill.billName}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <View style={[styles.categoryTag, { backgroundColor: item.category.color + '20' }]}>
          <Text style={[styles.categoryText, { color: item.category.color }]}>
            {item.category.categoryName}
          </Text>
        </View>
        <Text style={styles.balanceText}>Balance: {formatAmount(item.balanceAfter)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Transaction History</Text>
            <Text style={styles.headerSubtitle}>View your payment history</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F41BB" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1F41BB',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666666',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F41BB',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 14,
    color: '#666666',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  selectedPeriod: {
    backgroundColor: '#1F41BB',
  },
  periodText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedPeriodText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
