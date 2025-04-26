import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { goalService } from '../services/goal.service';
import { formatCurrency, formatDate } from '../utils/format';

// Define the navigation prop type
type GoalScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Goal'>;

interface Milestone {
  _id: string;
  amount: number;
  date: string;
  isAchieved: boolean;
  description: string;
}

interface Goal {
  _id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  targetDate: string;
  type: 'saving' | 'debt' | 'investment';
  status: 'active' | 'completed' | 'cancelled';
  description: string;
  milestones: Milestone[];
  progressPercentage?: number;
  daysRemaining?: number;
}

const GoalScreen = () => {
  const navigation = useNavigation<GoalScreenNavigationProp>();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await goalService.getUserGoals();
      console.log('GoalScreen - Response from getUserGoals:', response);
      
      // Kiểm tra cấu trúc response và log để debug
      if (response.success) {
        console.log('GoalScreen - Goals data:', response.data?.goals);
        
        // Đảm bảo goals là một mảng, ngay cả khi rỗng
        const goalsArray = response.data?.goals || [];
        
        if (goalsArray.length > 0) {
          // Calculate progress percentage for each goal
          const goalsWithProgress = goalsArray.map((goal: Goal) => {
            const progressPercentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            
            // Calculate days remaining
            const today = new Date();
            const targetDate = new Date(goal.targetDate);
            const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              ...goal,
              progressPercentage,
              daysRemaining
            };
          });
          
          setGoals(goalsWithProgress);
        } else {
          // Nếu không có goals, đặt mảng rỗng
          console.log('GoalScreen - No goals found, setting empty array');
          setGoals([]);
        }
      } else {
        console.error('GoalScreen - Failed to load goals:', response.message);
        setError('Failed to load goals');
      }
    } catch (err) {
      console.error('GoalScreen - Error loading goals:', err);
      setError('An error occurred while loading goals');
    } finally {
      setLoading(false);
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'saving':
        return 'save-outline';
      case 'debt':
        return 'cash-outline';
      case 'investment':
        return 'trending-up-outline';
      default:
        return 'flag-outline';
    }
  };

  const getGoalColor = (type: string) => {
    switch (type) {
      case 'saving':
        return '#4CAF50';
      case 'debt':
        return '#F44336';
      case 'investment':
        return '#2196F3';
      default:
        return '#1F41BB';
    }
  };

  const handleAddGoal = () => {
    navigation.navigate('CreateGoal');
  };

  const handleGoalDetail = (goalId: string) => {
    navigation.navigate('GoalDetail', { goalId } as const);
  };

  const renderGoalItem = (goal: Goal) => {
    // Fix progress bar width TypeScript error by using a numeric value
    const progressPercent = goal.progressPercentage || 0;
    
    return (
      <TouchableOpacity 
        key={goal._id} 
        style={styles.goalItem}
        onPress={() => handleGoalDetail(goal._id)}
      >
        <View style={styles.goalHeader}>
          <View style={[styles.goalIcon, { backgroundColor: `${getGoalColor(goal.type)}20` }]}>
            <Ionicons name={getGoalIcon(goal.type)} size={24} color={getGoalColor(goal.type)} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.goalName}</Text>
            <Text style={styles.amountText}>
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={[
              styles.statusText, 
              { color: goal.status === 'completed' ? '#4CAF50' : '#FF9800' }
            ]}>
              {goal.status === 'completed' ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        </View>

        <View style={styles.goalDetails}>
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${progressPercent}%`,
                    backgroundColor: getGoalColor(goal.type)
                  } as any
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{goal.progressPercentage}% completed</Text>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {goal.daysRemaining && goal.daysRemaining > 0 
                  ? `${goal.daysRemaining} days remaining` 
                  : 'Due date passed'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="flag-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {goal.milestones.filter(m => m.isAchieved).length} of {goal.milestones.length} milestones achieved
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Financial Goals</Text>
        {/* <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddGoal}
        >
          <Ionicons name="add-circle-outline" size={24} color="#1F41BB" />
          <Text style={styles.addButtonText}>Add Goal</Text>
        </TouchableOpacity> */}
      </View>

      {/* Goal List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F41BB" />
          <Text style={styles.loadingText}>Loading your goals...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGoals}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flag-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No Goals Yet</Text>
          <Text style={styles.emptyText}>
            Set financial goals to track your progress and stay motivated.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleAddGoal}
          >
            <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.goalsContainer}>
            {goals.map((goal) => renderGoalItem(goal))}
          </View>
        </ScrollView>
      )}

      {/* Floating Action Button for adding a goal */}
      <FloatingActionButton 
        iconName="add-outline"
        onPress={handleAddGoal}
      />
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#1F41BB',
    fontSize: 16,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  goalsContainer: {
    flex: 1,
  },
  goalItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalDetails: {
    marginTop: 8,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1F41BB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#1F41BB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default GoalScreen;
