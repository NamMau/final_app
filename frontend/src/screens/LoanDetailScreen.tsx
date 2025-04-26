import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loanService } from '../services/loan.service';
import { goalService } from '../services/goal.service';
import { formatCurrency, formatDate } from '../utils/format';

type LoanDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoanDetail'>;
type LoanDetailScreenRouteProp = RouteProp<RootStackParamList, 'LoanDetail'>;

interface PaymentSchedule {
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
  principalPayment?: number;
  interestPayment?: number;
  remainingBalance?: number;
}

interface Loan {
  _id: string;
  loanName: string;
  loanAmount: number;
  remainingBalance: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  status: 'active' | 'completed' | 'defaulted';
  paymentSchedule: PaymentSchedule[];
  goalID?: string;
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
}

const LoanDetailScreen = () => {
  const navigation = useNavigation<LoanDetailScreenNavigationProp>();
  const route = useRoute<LoanDetailScreenRouteProp>();
  const { loanId } = route.params;
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    loadLoanDetails();
  }, [loanId]);

  const loadLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await loanService.getLoanDetails(loanId);
      
      if (response.success && response.data) {
        if (response.data.loan) {
          setLoan(response.data.loan);
          
          // Calculate progress percentage
          const initialAmount = response.data.loan.loanAmount;
          const remaining = response.data.loan.remainingBalance;
          const paid = initialAmount - remaining;
          const percentage = Math.min(Math.round((paid / initialAmount) * 100), 100);
          setProgressPercentage(percentage);
          
          // Load associated goal if exists
          if (response.data.loan.goalID) {
            try {
              // Đảm bảo goalID là string
              let goalId: string;
              
              // Kiểm tra nếu goalID là object với _id
              if (typeof response.data.loan.goalID === 'object' && response.data.loan.goalID !== null) {
                // Sử dụng type assertion để truy cập _id
                const goalObject = response.data.loan.goalID as { _id?: string };
                if (goalObject._id) {
                  goalId = goalObject._id;
                } else {
                  console.error('Invalid goalID object structure:', response.data.loan.goalID);
                  return; // Không tiếp tục nếu không có _id
                }
              } else {
                // Nếu goalID là string, sử dụng trực tiếp
                goalId = response.data.loan.goalID as string;
              }
              
              console.log('Loading goal details for goalId:', goalId);
              const goalResponse = await goalService.getGoalDetails(goalId);
              
              if (goalResponse.success && goalResponse.data && goalResponse.data.goal) {
                setGoal(goalResponse.data.goal);
              }
            } catch (err) {
              console.error('Error loading goal details:', err);
            }
          }
        }
      } else {
        setError('Failed to load loan details');
      }
    } catch (err) {
      console.error('Error loading loan details:', err);
      setError('An error occurred while loading loan details');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = (paymentIndex: number) => {
    navigation.navigate('RecordLoanPayment', { 
      loanId: loanId,
      paymentIndex: paymentIndex
    });
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
          <Text style={styles.headerTitle}>Loan Details</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1F41BB" />
            <Text style={styles.loadingText}>Loading loan details...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error || 'Loan not found'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadLoanDetails}>
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
        <Text style={styles.headerTitle}>{loan.loanName}</Text>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          {/* Loan Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.loanIcon}>
                <Ionicons name="cash-outline" size={32} color="#1F41BB" />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.loanStatus}>
                  {loan.status === 'completed' ? '✅ Paid Off' : '🔄 Active Loan'}
                </Text>
              </View>
            </View>

            <View style={styles.amountSection}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Remaining Balance:</Text>
                <Text style={styles.currentAmount}>{formatCurrency(loan.remainingBalance)}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total Loan Amount:</Text>
                <Text style={styles.targetAmount}>{formatCurrency(loan.loanAmount)}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Repayment Progress</Text>
                <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: progressBarWidth,
                      backgroundColor: '#1F41BB'
                    } as any
                  ]} 
                />
              </View>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Interest Rate:</Text>
                <Text style={styles.detailValue}>{loan.interestRate}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monthly Payment:</Text>
                <Text style={styles.detailValue}>{formatCurrency(loan.monthlyPayment)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date:</Text>
                <Text style={styles.detailValue}>{formatDate(loan.startDate)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date:</Text>
                <Text style={styles.detailValue}>{formatDate(loan.endDate)}</Text>
              </View>
            </View>

            {goal && (
              <View style={styles.goalSection}>
                <Text style={styles.sectionTitle}>Linked Goal</Text>
                <TouchableOpacity 
                  style={styles.goalCard}
                  onPress={() => navigation.navigate('GoalDetail', { goalId: goal._id })}
                >
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.goalName}</Text>
                    <Text style={styles.goalType}>
                      {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Payment Schedule Section */}
          <View style={styles.scheduleCard}>
            <Text style={styles.sectionTitle}>Payment Schedule</Text>
            
            {loan.paymentSchedule.length === 0 ? (
              <Text style={styles.noScheduleText}>No payment schedule available</Text>
            ) : (
              loan.paymentSchedule.map((payment, index) => (
                <View key={index} style={styles.paymentItem}>
                  <View style={styles.paymentHeader}>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentTitle}>
                        Payment #{index + 1}
                      </Text>
                      <Text style={styles.paymentDate}>
                        Due: {formatDate(payment.dueDate)}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(payment.amount)}
                    </Text>
                  </View>
                  
                  {payment.isPaid ? (
                    <View style={styles.paidBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.paidText}>
                        Paid on {payment.paidDate ? formatDate(payment.paidDate) : 'N/A'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.recordButton}
                      onPress={() => handleRecordPayment(index)}
                    >
                      <Text style={styles.recordButtonText}>Record Payment</Text>
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
  loanIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(31, 65, 187, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  loanStatus: {
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
  detailsSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  goalSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  goalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  goalType: {
    fontSize: 14,
    color: '#666',
  },
  scheduleCard: {
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
  noScheduleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  paymentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paidText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  recordButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F4FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  recordButtonText: {
    fontSize: 14,
    color: '#1F41BB',
    fontWeight: '500',
  },
});

export default LoanDetailScreen;
