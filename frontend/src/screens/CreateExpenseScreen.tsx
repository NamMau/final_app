import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

type CreateExpenseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateExpense'>;

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

const data = {
  labels: ['1D', '1W', '1M', '3M', '1Y', 'ALL'],
  datasets: [{
    data: [2100, 2400, 2000, 2800, 3000, 2300, 2500],
    color: (opacity = 1) => `rgba(31, 65, 187, ${opacity})`,
    strokeWidth: 2
  }]
};

const categoryData = [
  { name: 'Food & Drink', amount: 1200, percentage: 40 },
  { name: 'Shopping', amount: 800, percentage: 25 },
  { name: 'Transport', amount: 500, percentage: 15 },
  { name: 'Bills', amount: 1023, percentage: 20 },
];

export default function CreateExpenseScreen() {
  const navigation = useNavigation<CreateExpenseScreenNavigationProp>();
  const [amount, setAmount] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>Track your spending</Text>
          </View>
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

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          {/* Expense Amount Section */}
          <View style={styles.expenseCard}>
            <Text style={styles.expenseTitle}>Expenses</Text>
            <Text style={styles.expenseAmount}>${amount || '3,523'}</Text>
            <Text style={styles.expenseSubtitle}>Last 30 Days +12%</Text>
          </View>

          {/* Chart Section */}
          <View style={styles.chartCard}>
            <LineChart
              data={data}
              width={screenWidth - 40}
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

          {/* Add Expense Section */}
          <TouchableOpacity style={styles.addExpenseCard}>
            <View style={styles.addExpenseHeader}>
              <Text style={styles.addExpenseTitle}>Add an expense</Text>
              <Ionicons name="add-circle" size={24} color="#1F41BB" />
            </View>
            <Text style={styles.addExpenseSubtitle}>Enter manually or scan a bill</Text>
          </TouchableOpacity>

          {/* Expenses by Category */}
          <View style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>Expenses by category</Text>
            {categoryData.map((category, index) => (
              <View key={index} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryAmount}>${category.amount}</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${category.percentage}%` }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 16,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  expenseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  expenseTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  expenseSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
  },
  chartCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  addExpenseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  addExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addExpenseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  addExpenseSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  categoryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#000000',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F41BB',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1F41BB',
    borderRadius: 4,
  },
}); 