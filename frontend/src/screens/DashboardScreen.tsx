import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { LineChart } from 'react-native-chart-kit';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(31, 65, 187, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#1F41BB'
  },
  propsForBackgroundLines: {
    strokeWidth: 1,
    stroke: '#e3e3e3',
    strokeDasharray: '0',
  },
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const spendingData = {
  labels: ['1D', '1W', '1M', '3M', '1Y', 'ALL'],
  datasets: [{
    data: [1200, 1100, 1500, 1000, 1800, 1200],
    color: (opacity = 1) => `rgba(31, 65, 187, ${opacity})`,
    strokeWidth: 2
  }]
};

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>2.589.500 $</Text>
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

      {/* Content */}
      <View style={styles.contentSection}>
        {/* Spending Analysis */}
        <View style={styles.spendingCard}>
          <Text style={styles.spendingTitle}>Spending Analysis</Text>
          <Text style={styles.totalSpending}>$1,200</Text>
          <Text style={styles.spendingSubtitle}>Last 30 Days +12%</Text>
          
          <View style={styles.chartContainer}>
            <LineChart
              data={spendingData}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              withInnerLines={true}
              withOuterLines={true}
              withHorizontalLabels={true}
              withVerticalLabels={true}
            />
          </View>
        </View>
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

        <TouchableOpacity style={styles.navButton} 
          onPress={() => navigation.navigate('Budget')}>
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
  contentSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
  },
  spendingCard: {
    marginHorizontal: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
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
  chartContainer: {
    alignItems: 'center',
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