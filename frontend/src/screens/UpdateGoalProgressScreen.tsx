import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { goalService } from '../services/goal.service';
import { formatCurrency } from '../utils/format';

type UpdateGoalProgressScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpdateGoalProgress'>;
type UpdateGoalProgressScreenRouteProp = RouteProp<RootStackParamList, 'UpdateGoalProgress'>;

interface Goal {
  _id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  type: 'saving' | 'debt' | 'investment';
}

const UpdateGoalProgressScreen = () => {
  const navigation = useNavigation<UpdateGoalProgressScreenNavigationProp>();
  const route = useRoute<UpdateGoalProgressScreenRouteProp>();
  const { goalId } = route.params;
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [amount, setAmount] = useState('');
  const [isAddition, setIsAddition] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoalDetails();
  }, [goalId]);

  const loadGoalDetails = async () => {
    try {
      setLoading(true);
      const response = await goalService.getGoalDetails(goalId);
      
      if (response.success && response.data && response.data.goal) {
        setGoal(response.data.goal);
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

  const validateForm = () => {
    if (!amount.trim()) {
      Alert.alert('Error', 'Amount is required');
      return false;
    }
    
    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Amount must be a positive number');
      return false;
    }
    
    return true;
  };

  const handleUpdateProgress = async () => {
    if (!validateForm() || !goal) return;
    
    try {
      setSubmitting(true);
      
      const updateData = {
        currentAmount: isAddition 
          ? goal.currentAmount + Number(amount) 
          : goal.currentAmount - Number(amount)
      };
      
      const response = await goalService.updateGoalProgress(goalId, updateData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Goal progress updated successfully!',
          [{ text: 'OK', onPress: () => navigation.navigate('GoalDetail', { goalId }) }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to update goal progress');
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      Alert.alert('Error', 'An error occurred while updating goal progress');
    } finally {
      setSubmitting(false);
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
          <Text style={styles.headerTitle}>Update Progress</Text>
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
          <Text style={styles.headerTitle}>Update Progress</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Progress</Text>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <View style={styles.goalInfoSection}>
              <Text style={styles.goalName}>{goal.goalName}</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Current Amount:</Text>
                <Text style={styles.currentAmount}>{formatCurrency(goal.currentAmount)}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Target Amount:</Text>
                <Text style={styles.targetAmount}>{formatCurrency(goal.targetAmount)}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Update Type</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity 
                  style={[
                    styles.toggleButton, 
                    isAddition ? styles.toggleButtonActive : null,
                    isAddition ? { backgroundColor: `${getGoalColor(goal.type)}20` } : null
                  ]}
                  onPress={() => setIsAddition(true)}
                >
                  <Ionicons 
                    name="add-circle-outline" 
                    size={20} 
                    color={isAddition ? getGoalColor(goal.type) : '#666'} 
                  />
                  <Text 
                    style={[
                      styles.toggleText,
                      isAddition ? { color: getGoalColor(goal.type) } : null
                    ]}
                  >
                    Add Progress
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.toggleButton, 
                    !isAddition ? styles.toggleButtonActive : null,
                    !isAddition ? { backgroundColor: `${getGoalColor(goal.type)}20` } : null
                  ]}
                  onPress={() => setIsAddition(false)}
                >
                  <Ionicons 
                    name="remove-circle-outline" 
                    size={20} 
                    color={!isAddition ? getGoalColor(goal.type) : '#666'} 
                  />
                  <Text 
                    style={[
                      styles.toggleText,
                      !isAddition ? { color: getGoalColor(goal.type) } : null
                    ]}
                  >
                    Subtract Progress
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                {isAddition 
                  ? 'Enter the amount to add to your current progress' 
                  : 'Enter the amount to subtract from your current progress'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: getGoalColor(goal.type) }]}
              onPress={handleUpdateProgress}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Update Progress</Text>
              )}
            </TouchableOpacity>
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
  formContainer: {
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
  goalInfoSection: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 16,
  },
  goalName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleButtonActive: {
    borderColor: 'transparent',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UpdateGoalProgressScreen;
