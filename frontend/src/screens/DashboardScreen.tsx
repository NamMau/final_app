import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { transactionsService, TransactionStats } from '../services/transactions.service';
import { BarChart } from 'react-native-chart-kit';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(31, 65, 187, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  propsForBackgroundLines: {
    strokeWidth: 1,
    stroke: '#e3e3e3',
    strokeDasharray: '0',
  },
  propsForVerticalLabels: {
    fontSize: 10,
    rotation: 0
  },
  propsForHorizontalLabels: {
    fontSize: 10
  },
  barRadius: 4,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  decimalPlaces: 0,
  formatYLabel: (value: string) => {
    if (!value) return '0';
    const amount = parseInt(value);
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  },
  formatXLabel: (value: string) => {
    const date = new Date(value);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  },
  showBarTops: true,
  showValuesOnTopOfBars: true,
  yAxisLabelWidth: 60,
  yAxisInterval: 1
};

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [balance, setBalance] = useState<number>(0);
  const [stats, setStats] = useState<TransactionStats[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [totalSpent, setTotalSpent] = useState<number>(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const loadBalance = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setBalance(user.totalBalance || 0);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  // Load balance and stats when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBalance();
      const fetchStats = async () => {
        try {
          const data = await transactionsService.getTransactionStats(selectedPeriod);
          setStats(data);
          const total = data.reduce((sum, stat) => sum + stat.total, 0);
          setTotalSpent(total);
        } catch (error) {
          console.error('Error fetching transaction stats:', error);
        }
      };
      fetchStats();
    });

    return unsubscribe;
  }, [navigation, selectedPeriod]);

  // Initial load
  useEffect(() => {
    loadBalance();
    const fetchStats = async () => {
      try {
        const data = await transactionsService.getTransactionStats(selectedPeriod);
        setStats(data);
        const total = data.reduce((sum, stat) => sum + stat.total, 0);
        setTotalSpent(total);
      } catch (error) {
        console.error('Error fetching transaction stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Reload stats when period changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await transactionsService.getTransactionStats(selectedPeriod);
        setStats(data);
        const total = data.reduce((sum, stat) => sum + stat.total, 0);
        setTotalSpent(total);
      } catch (error) {
        console.error('Error fetching transaction stats:', error);
      }
    };
    fetchStats();
  }, [selectedPeriod]);

  // Listen for balance updates from other screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find(r => r.name === 'Dashboard')?.params;
      if (params && 'balanceUpdated' in params && params.balanceUpdated) {
        loadBalance();
      }
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/100' }}
            style={styles.avatar}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="send" size={24} color="#1F41BB" />
          </View>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="trophy-outline" size={24} color="#1F41BB" />
          </View>
          <Text style={styles.actionText}>Goals</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} 
          onPress={() => navigation.navigate('Loan')}>
          <View style={styles.actionIcon}>
            <Ionicons name="cash" size={24} color="#1F41BB" />
          </View>
          <Text style={styles.actionText}>Loan</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('BillScanner', undefined)}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="receipt-outline" size={24} color="#1F41BB" />
          </View>
          <Text style={styles.actionText}>Scan Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Category')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="grid-outline" size={24} color="#1F41BB" />
          </View>
          <Text style={styles.actionText}>Categories</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.contentSection}>
        {/* Spending Analysis */}
        <View style={styles.spendingCard}>
          <Text style={styles.spendingTitle}>Spending Analysis</Text>
          <Text style={styles.totalSpending}>{formatCurrency(totalSpent)}</Text>
          <Text style={styles.spendingSubtitle}>Last {selectedPeriod}</Text>
          
          {stats.length > 0 ? (
            <View style={styles.chartContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chartScrollView}
              >
                <BarChart
                  data={{
                    labels: stats.map(stat => stat.date),
                    datasets: [{
                      data: stats.map(stat => stat.total),
                      color: (opacity = 1) => `rgba(31, 65, 187, ${opacity})`
                    }]
                  }}
                  width={Math.max(screenWidth, stats.length * 80)}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  withInnerLines={true}
                  yAxisLabel=""
                  yAxisSuffix=" đ"
                  verticalLabelRotation={0}
                  segments={5}
                  fromZero={true}
                  showValuesOnTopOfBars={true}
                  yAxisInterval={1}/>
              </ScrollView>
              <View style={styles.periodSelector}>
                <TouchableOpacity
                  style={[styles.periodButton, selectedPeriod === 'week' && styles.selectedPeriod]}
                  onPress={() => setSelectedPeriod('week')}
                >
                  <Text style={[styles.periodText, selectedPeriod === 'week' && styles.selectedPeriodText]}>Week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodButton, selectedPeriod === 'month' && styles.selectedPeriod]}
                  onPress={() => setSelectedPeriod('month')}
                >
                  <Text style={[styles.periodText, selectedPeriod === 'month' && styles.selectedPeriodText]}>Month</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodButton, selectedPeriod === 'year' && styles.selectedPeriod]}
                  onPress={() => setSelectedPeriod('year')}
                >
                  <Text style={[styles.periodText, selectedPeriod === 'year' && styles.selectedPeriodText]}>Year</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <Ionicons name="home" size={24} color="#1F41BB" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('TransactionHistory', undefined)}
        >
          <Ionicons name="time" size={24} color="#666" />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addTransactionButton}>
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} 
          onPress={() => navigation.navigate('Budget', undefined)}>
          <Ionicons name="wallet-outline" size={24} color="#666" />
          <Text style={styles.navText}>Budgets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Profile', { balanceUpdated: false })}
        >
          <Ionicons name="person" size={24} color="#666" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F41BB',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  chartContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  chartScrollView: {
    marginHorizontal: -16,
  },
  chart: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingRight: 20
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  selectedPeriod: {
    backgroundColor: '#1F41BB',
  },
  periodText: {
    color: '#666666',
    fontSize: 14,
  },
  selectedPeriodText: {
    color: '#FFFFFF',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  balanceLabel: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 16,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  spendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  spendingTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  totalSpending: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  spendingSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  navButton: {
    alignItems: 'center',
  },
  navButtonActive: {
    opacity: 1
  },
  navText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#1F41BB',
  },
  addTransactionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1F41BB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
  },
});

export default DashboardScreen; 