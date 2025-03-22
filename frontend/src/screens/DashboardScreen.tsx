import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  icon: string;
}

const transactions: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    title: 'Grocery',
    subtitle: 'Eataly downtown',
    amount: 50.68,
    date: 'Aug 26',
    icon: 'basket-outline'
  },
  {
    id: '2',
    type: 'expense',
    title: 'Transport',
    subtitle: 'UBER Pool',
    amount: 6.00,
    date: 'Aug 26',
    icon: 'car-outline'
  },
  {
    id: '3',
    type: 'income',
    title: 'Payment',
    subtitle: 'Payment from Andre',
    amount: 560.00,
    date: 'Aug 25',
    icon: 'cash-outline'
  },
  {
    id: '4',
    type: 'income',
    title: 'Monthly Salary',
    subtitle: 'Salary from January',
    amount: 560.00,
    date: 'Aug 25',
    icon: 'cash-outline'
  },
];

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>2,589.50 vnd</Text>
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

        <TouchableOpacity style={styles.actionButton}>
          <View style={styles.actionIcon}>
            <Ionicons name="cash" size={24} color="#1F41BB" />
          </View>
          <Text style={styles.actionText}>Loan</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('BillScanner')}
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

      {/* Transactions Section */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Filters */}
        <View style={styles.filters}>
          <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
            <Text style={[styles.filterText, styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <View style={styles.filterContent}>
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.filterText}>Income</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <View style={styles.filterContent}>
              <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.filterText}>Expense</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <View style={styles.filterContent}>
              <View style={[styles.dot, { backgroundColor: '#2980b9' }]} />
              <Text style={styles.filterText}>Categories</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <ScrollView style={styles.transactionsList}>
          <Text style={styles.dateLabel}>TODAY</Text>
          {transactions.map(transaction => (
            <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={styles.transactionIcon}>
                  <Ionicons name={transaction.icon as any} size={24} color="#1F41BB" />
                </View>
                <View>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <Text style={styles.transactionSubtitle}>{transaction.subtitle}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'expense' ? styles.expenseText : styles.incomeText
                ]}>
                  {transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toFixed(2)}
                </Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <Ionicons name="home" size={24} color="#1F41BB" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="time" size={24} color="#666" />
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addTransactionButton}>
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="wallet-outline" size={24} color="#666" />
          <Text style={styles.navText}>Budgets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Profile')}
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
  transactionsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  seeAllButton: {
    color: '#1F41BB',
    fontSize: 14,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#1F41BB',
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    color: '#666666',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  transactionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseText: {
    color: '#F44336',
  },
  incomeText: {
    color: '#4CAF50',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666666',
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