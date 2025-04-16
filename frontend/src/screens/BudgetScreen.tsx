import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type BudgetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Budget'>;

interface BudgetItem {
  category: string;
  budgeted: number;
  used: number;
  percentage: number;
}

const SAMPLE_BUDGETS: BudgetItem[] = [
  {
    category: 'Entertainment',
    budgeted: 250.00,
    used: 200.00,
    percentage: 80,
  },
  {
    category: 'Groceries',
    budgeted: 500.00,
    used: 150.00,
    percentage: 30,
  },
  {
    category: 'Shopping',
    budgeted: 300.00,
    used: 180.00,
    percentage: 60,
  },
];

const BudgetScreen = () => {
  const navigation = useNavigation<BudgetScreenNavigationProp>();

  const renderBudgetItem = (item: BudgetItem) => (
    <View key={item.category} style={styles.budgetItem}>
      <View style={styles.budgetHeader}>
        <View style={styles.categoryIcon}>
          <Ionicons name="wallet-outline" size={24} color="#1F41BB" />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryText}>{item.category}</Text>
          <Text style={styles.amountText}>
            ${item.budgeted.toFixed(2)} budgeted
          </Text>
        </View>
        <Text style={styles.percentageText}>{item.percentage}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${item.percentage}%` }
          ]} 
        />
      </View>
    </View>
  );

  const handleAddBudget = () => {
    // Navigate to create budget screen
    // navigation.navigate('CreateBudget');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Budgets</Text>
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
          {SAMPLE_BUDGETS.map(renderBudgetItem)}

          <View style={styles.createSection}>
            <Text style={styles.createTitle}>Set up budgets for your spending</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleAddBudget}>
              <Text style={styles.createButtonText}>Create a new budget</Text>
              <View style={styles.addIconContainer}>
                <Ionicons name="add" size={24} color="#1F41BB" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <FloatingActionButton onPress={handleAddBudget} />
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
  budgetItem: {
    marginBottom: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  amountText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
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
  createSection: {
    marginTop: 24,
    marginBottom: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  createTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  createButtonText: {
    fontSize: 16,
    color: '#1F41BB',
    fontWeight: '500',
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLeft: {
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
});

export default BudgetScreen; 