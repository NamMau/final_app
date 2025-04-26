import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { goalService } from '../services/goal.service';
import { formatCurrency, formatDate } from '../utils/format';

type GoalDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GoalDetail'>;
type GoalDetailScreenRouteProp = RouteProp<RootStackParamList, 'GoalDetail'>;

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
}

const GoalDetailScreen = () => {
  const navigation = useNavigation<GoalDetailScreenNavigationProp>();
  const route = useRoute<GoalDetailScreenRouteProp>();
  const { goalId } = route.params;
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [upcomingMilestones, setUpcomingMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    loadGoalDetails();
  }, [goalId]);

  const loadGoalDetails = async () => {
    try {
      setLoading(true);
      const response = await goalService.getGoalDetails(goalId);
      
      if (response.success && response.data) {
        // Kiểm tra null/undefined trước khi gán giá trị
        if (response.data.goal) {
          setGoal(response.data.goal);
        }
        
        // Sử dụng toán tử nullish coalescing để cung cấp giá trị mặc định là 0
        setProgressPercentage(response.data.progressPercentage ?? 0);
        setDaysRemaining(response.data.daysRemaining ?? 0);
        
        // Sử dụng toán tử nullish coalescing để cung cấp mảng rỗng nếu upcomingMilestones là undefined
        setUpcomingMilestones(response.data.upcomingMilestones ?? []);
      } else {
        setError('Failed to load goal details');
      }
    } catch (err) {
      console.error('Error loading goal details:', err);
      setError('An error occurred while loading goal details');
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

  const handleUpdateProgress = async () => {
    // Navigate to update progress screen
    navigation.navigate('UpdateGoalProgress', { goalId: goalId });
  };

  const handleMarkMilestoneComplete = async (milestoneIndex: number) => {
    try {
      if (!goal) return;
      
      const response = await goalService.updateGoalProgress(goal._id, {
        milestoneIndex,
        isAchieved: true
      });
      
      if (response.success) {
        Alert.alert('Success', 'Milestone marked as completed!');
        loadGoalDetails();
      } else {
        Alert.alert('Error', 'Failed to update milestone');
      }
    } catch (err) {
      console.error('Error updating milestone:', err);
      Alert.alert('Error', 'An error occurred while updating milestone');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goal Details</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1F41BB" />
            <Text style={styles.loadingText}>Loading goal details...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goal Details</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error || 'Goal not found'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadGoalDetails}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Fix the progress bar width TypeScript error
  const progressBarWidth = `${progressPercentage || 0}%`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{goal.goalName}</Text>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          {/* Goal Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={[styles.goalIcon, { backgroundColor: `${getGoalColor(goal.type)}20` }]}>
                <Ionicons name={getGoalIcon(goal.type)} size={32} color={getGoalColor(goal.type)} />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.goalType}>
                  {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal
                </Text>
                <Text style={styles.goalStatus}>
                  {goal.status === 'completed' ? '✅ Completed' : '🔄 In Progress'}
                </Text>
              </View>
            </View>

            <View style={styles.amountSection}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Current Amount:</Text>
                <Text style={styles.currentAmount}>{formatCurrency(goal.currentAmount)}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Target Amount:</Text>
                <Text style={styles.targetAmount}>{formatCurrency(goal.targetAmount)}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: progressBarWidth,
                      backgroundColor: getGoalColor(goal.type)
                    } as any
                  ]} 
                />
              </View>
            </View>

            <View style={styles.dateSection}>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={styles.dateValue}>{formatDate(goal.startDate)}</Text>
                </View>
              </View>
              <View style={styles.dateItem}>
                <Ionicons name="flag-outline" size={20} color="#666" />
                <View>
                  <Text style={styles.dateLabel}>Target Date</Text>
                  <Text style={styles.dateValue}>{formatDate(goal.targetDate)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.timeRemainingSection}>
              <Text style={styles.timeRemainingLabel}>
                {daysRemaining > 0 
                  ? `${daysRemaining} days remaining to reach your goal` 
                  : 'Target date has passed'}
              </Text>
            </View>

            {goal.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{goal.description}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.updateButton}
              onPress={handleUpdateProgress}
            >
              <Text style={styles.updateButtonText}>Update Progress</Text>
            </TouchableOpacity>
          </View>

          {/* Milestones Section */}
          <View style={styles.milestonesCard}>
            <Text style={styles.sectionTitle}>Milestones</Text>
            
            {goal.milestones.length === 0 ? (
              <Text style={styles.noMilestonesText}>No milestones set for this goal</Text>
            ) : (
              goal.milestones.map((milestone, index) => (
                <View key={milestone._id || index} style={styles.milestoneItem}>
                  <View style={styles.milestoneHeader}>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneTitle}>
                        {milestone.description || `Milestone ${index + 1}`}
                      </Text>
                      <Text style={styles.milestoneDate}>
                        Due: {formatDate(milestone.date)}
                      </Text>
                    </View>
                    <Text style={styles.milestoneAmount}>
                      {formatCurrency(milestone.amount)}
                    </Text>
                  </View>
                  
                  {milestone.isAchieved ? (
                    <View style={styles.achievedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.achievedText}>Completed</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.markCompleteButton}
                      onPress={() => handleMarkMilestoneComplete(index)}
                    >
                      <Text style={styles.markCompleteText}>Mark as Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
    padding: 20,
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  goalType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  goalStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  amountSection: {
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
  },
  currentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  targetAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  timeRemainingSection: {
    backgroundColor: '#F0F4FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  timeRemainingLabel: {
    fontSize: 16,
    color: '#1F41BB',
    textAlign: 'center',
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  updateButton: {
    backgroundColor: '#1F41BB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  milestonesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  noMilestonesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  milestoneItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  milestoneDate: {
    fontSize: 14,
    color: '#666',
  },
  milestoneAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  achievedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  markCompleteButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F4FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  markCompleteText: {
    fontSize: 14,
    color: '#1F41BB',
    fontWeight: '500',
  },
});

export default GoalDetailScreen;
