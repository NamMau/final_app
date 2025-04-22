import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Budget, budgetsService } from '../services/budgets.service';
import { categoriesService } from '../services/categories.service';
import { Category } from '../services/categories.service';

type BudgetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Budget'>;

interface BudgetWithCategory extends Budget {
  category?: Category;
}

const BudgetScreen = () => {
  const navigation = useNavigation<BudgetScreenNavigationProp>();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const [budgetsData, categoriesData] = await Promise.all([
        budgetsService.getBudgets(),
        categoriesService.getCategories()
      ]);

      // Create a map of categories for quick lookup
      const categoryMap = categoriesData.reduce((acc, cat) => {
        acc[cat._id] = cat;
        return acc;
      }, {} as { [key: string]: Category });
      setCategories(categoryMap);

      // Attach category objects to budgets
      const budgetsWithCategories = budgetsData.map(budget => ({
        ...budget,
        category: categoryMap[budget.categoryID]
      }));

      setBudgets(budgetsWithCategories);
    } catch (error) {
      console.error('Error loading budgets:', error);
      Alert.alert('Error', 'Failed to load budgets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [])
  );

  const renderBudgetItem = (item: BudgetWithCategory) => (
    <TouchableOpacity 
      key={item._id} 
      style={styles.budgetItem}
      onPress={() => navigation.navigate('UpdateBudget', { budget: item })}
    >
      <View style={styles.budgetHeader}>
        <View style={styles.categoryIcon}>
          <Ionicons 
            name={item.category?.icon as any || "wallet-outline"} 
            size={24} 
            color={item.category?.color || "#1F41BB"} 
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryText}>{item.name}</Text>
          <Text style={styles.amountText}>
            ${item.amount.toFixed(2)} budgeted • {item.period}
          </Text>
          <Text style={[styles.amountText, item.isOverBudget && styles.overBudget]}>
            ${item.spent.toFixed(2)} spent
          </Text>
        </View>
        <Text 
          style={[
            styles.percentageText,
            item.isOverBudget && styles.overBudget,
            item.isNearThreshold && !item.isOverBudget && styles.nearThreshold
          ]}
        >
          {Math.round(item.progress || 0)}%
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${Math.min((item.progress || 0), 100)}%` },
            item.isOverBudget && styles.overBudgetBar,
            item.isNearThreshold && !item.isOverBudget && styles.nearThresholdBar
          ]} 
        />
      </View>
    </TouchableOpacity>
  );

  const handleAddBudget = () => {
    navigation.navigate('CreateBudget');
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
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1F41BB"
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1F41BB" />
              <Text style={styles.loadingText}>Loading budgets...</Text>
            </View>
          ) : budgets.length > 0 ? (
            budgets.map(renderBudgetItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#1F41BB" />
              <Text style={styles.emptyText}>No budgets yet</Text>
              <Text style={styles.emptySubtext}>Create your first budget to start tracking expenses</Text>
            </View>
          )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  overBudget: {
    color: '#DC2626',
  },
  nearThreshold: {
    color: '#F59E0B',
  },
  overBudgetBar: {
    backgroundColor: '#DC2626',
  },
  nearThresholdBar: {
    backgroundColor: '#F59E0B',
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