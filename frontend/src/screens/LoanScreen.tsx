import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loanService } from '../services/loan.service';
import { formatCurrency, formatDate } from '../utils/format';
import FloatingActionButton from '../components/FloatingActionButton';

// Define the navigation prop type
type LoanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Loan'>;

// Loan type definition
interface LoanItem {
  _id: string;
  loanName: string;
  loanAmount: number;
  remainingBalance: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  status: 'active' | 'completed' | 'defaulted';
  paymentSchedule: {
    dueDate: string;
    amount: number;
    isPaid: boolean;
    paidDate?: string;
  }[];
  goalID?: string;
}

const LoanScreen = () => {
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<LoanScreenNavigationProp>();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const response = await loanService.getUserLoans();
      if (response.success && response.data && response.data.loans) {
        setLoans(response.data.loans);
      } else {
        console.error('Failed to fetch loans:', response.message || 'Unknown error');
        setLoans([]);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (loan: LoanItem): number => {
    if (loan.loanAmount <= 0) return 0;
    const progress = (loan.loanAmount - loan.remainingBalance) / loan.loanAmount * 100;
    return Math.min(Math.round(progress), 100);
  };

  const handleRecordPayment = (loanId: string) => {
    navigation.navigate('RecordLoanPayment', { loanId } as any);
  };

  const handleViewLoanDetails = (loanId: string) => {
    navigation.navigate('LoanDetail', { loanId } as any);
  };

  const handleAddLoan = () => {
    navigation.navigate('CreateLoan');
  };

  const handleViewGoal = (goalId?: string | any) => {
    if (!goalId) return;
  
    // Kiểm tra nếu goalId là một object (đã được populate từ backend)
    let goalIdString: string;
  
    if (typeof goalId === 'object' && goalId !== null) {
      // Nếu là object và có _id, sử dụng _id
      if (goalId._id) {
        goalIdString = goalId._id;
      } else {
        console.error('Invalid goalID object:', goalId);
        Alert.alert('Error', 'Cannot view goal details: Invalid goal ID');
        return;
      }
    } else {
      // Nếu là string, sử dụng trực tiếp
      goalIdString = goalId as string;
    }
  
    console.log('Navigating to GoalDetail with goalId:', goalIdString);
    navigation.navigate('GoalDetail', { goalId: goalIdString });
  };

  const renderLoanItem = (loan: LoanItem) => {
    const progress = calculateProgress(loan);
    const progressBarWidth = `${progress}%`;
    
    return (
      <TouchableOpacity 
        key={loan._id} 
        style={styles.loanItem}
        onPress={() => handleViewLoanDetails(loan._id)}
      >
        <View style={styles.loanHeader}>
          <View style={styles.loanIcon}>
            <Ionicons name="cash-outline" size={24} color="#1F41BB" />
          </View>
          <View style={styles.loanInfo}>
            <Text style={styles.loanTitle}>{loan.loanName}</Text>
            <Text style={styles.amountText}>
              {formatCurrency(loan.loanAmount)}
            </Text>
          </View>
          {loan.status === 'completed' && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>Paid</Text>
            </View>
          )}
        </View>

        <View style={styles.loanDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Your estimated interest</Text>
              <Text style={styles.detailValue}>
                You could save {formatCurrency(loan.interestRate * loan.loanAmount / 100)}
              </Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="trending-up-outline" size={24} color="#1F41BB" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pay off by</Text>
              <Text style={styles.detailValue}>{formatDate(loan.endDate)}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="calendar-outline" size={24} color="#1F41BB" />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Monthly payment</Text>
              <Text style={styles.detailValue}>{formatCurrency(loan.monthlyPayment)}</Text>
            </View>
            {loan.status === 'active' && (
              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={() => handleRecordPayment(loan._id)}
              >
                <Text style={styles.paymentButtonText}>Record Payment</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Monitor your progress</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: progressBarWidth } as any
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{progress}% paid</Text>
          </View>
          
          {loan.goalID && (
            <TouchableOpacity 
              style={styles.viewGoalButton}
              onPress={() => handleViewGoal(loan.goalID)}
            >
              <Ionicons name="flag-outline" size={16} color="#1F41BB" />
              <Text style={styles.viewGoalText}>View Repayment Goal</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Loans</Text>
        {/* <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddLoan}
        >
          <Ionicons name="add-circle-outline" size={24} color="#1F41BB" />
          <Text style={styles.addButtonText}>Add Loan</Text>
        </TouchableOpacity> */}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Loan List */}
        {!isLoading && (
          loans && loans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No Loans Yet</Text>
              <Text style={styles.emptyText}>
                You haven't added any loans yet. Add your first loan to start tracking your repayments.
              </Text>
              {/* <TouchableOpacity 
                style={styles.emptyButton}
                onPress={handleAddLoan}
              >
                <Text style={styles.emptyButtonText}>Add Your First Loan</Text>
              </TouchableOpacity> */}
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              <View style={styles.loansContainer}>
                {loans && loans.length > 0 ? loans.map((loan) => renderLoanItem(loan)) : null}
              </View>
            </ScrollView>
          )
        )}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1F41BB" />
            <Text style={styles.loadingText}>Loading your loans...</Text>
          </View>
        )}
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton onPress={handleAddLoan} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F41BB',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#1F41BB',
    fontSize: 16,
    fontWeight: '500',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loansContainer: {
    paddingVertical: 20,
  },
  loanItem: {
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
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loanIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  loanInfo: {
    flex: 1,
  },
  loanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 16,
    color: '#666',
  },
  completedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },
  loanDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  paymentButton: {
    backgroundColor: '#1F41BB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
    backgroundColor: '#1F41BB',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  viewGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F4FF',
  },
  viewGoalText: {
    fontSize: 14,
    color: '#1F41BB',
    fontWeight: '500',
  },
});

export default LoanScreen;