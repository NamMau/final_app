import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { transactionsService, TransactionStats } from '../services/transactions.service';
import { BarChart } from 'react-native-chart-kit';
import notificationService, { Notification } from '../services/notification.service';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

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

  // Load notifications
  const loadNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      console.log('Notifications response:', response);
      if (response.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
        const unread = response.data.notifications.filter(n => n.status === 'unread').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Mark notification as read
  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (notification.status === 'unread') {
        await notificationService.markAsRead(notification._id);
        loadNotifications(); // Reload to update unread count
      }
      
      // Navigate to the linked screen if available
      if (notification.link) {
        setShowNotifications(false);
        const parts = notification.link.split('/');
        const screenName = parts[0];
        const params = parts.length > 1 ? { id: parts[1] } : undefined;
        
        // Handle navigation based on the link format
        if (screenName === 'Goal' && params?.id) {
          navigation.navigate('GoalDetail', { goalId: params.id });
        } else if (screenName === 'Loan' && params?.id) {
          navigation.navigate('LoanDetail', { loanId: params.id });
        } else if (screenName) {
          // @ts-ignore - Dynamic navigation
          navigation.navigate(screenName, params);
        }
      }
    } catch (error) {
      console.error('Error handling notification:', error);
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
      loadNotifications(); // Reload notifications on focus
    });

    return unsubscribe;
  }, [navigation, selectedPeriod]);

  // Initial load
  useEffect(() => {
    loadBalance();
    loadNotifications();
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
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/100' }}
            style={styles.avatar}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('FinancialReport')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="flag-outline" size={24} color="#1F41BB" />
          </View>
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Goal', undefined)}
        >
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
          <Text style={styles.actionText}>Bills</Text>
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

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {notifications.length > 0 ? (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.notificationItem, 
                      item.status === 'unread' && styles.unreadNotification
                    ]}
                    onPress={() => handleNotificationPress(item)}
                  >
                    <View style={styles.notificationIcon}>
                      {item.type === 'goal_achieved' && <Ionicons name="trophy" size={24} color="#1F41BB" />}
                      {item.type === 'budget_alert' && <Ionicons name="alert-circle" size={24} color="#FF6B6B" />}
                      {item.type === 'bill_due' && <Ionicons name="calendar" size={24} color="#FFB100" />}
                      {item.type === 'loan_payment' && <Ionicons name="cash" size={24} color="#4CAF50" />}
                      {item.type === 'system' && <Ionicons name="information-circle" size={24} color="#666" />}
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[
                        styles.notificationMessage,
                        item.status === 'unread' && styles.unreadText
                      ]}>
                        {item.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Text>
                    </View>
                    {item.priority === 'high' && (
                      <View style={styles.priorityIndicator} />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyNotifications}>
                <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notificationModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: 'rgba(31, 65, 187, 0.05)',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginLeft: 8,
  },
  emptyNotifications: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
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