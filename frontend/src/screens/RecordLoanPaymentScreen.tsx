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
import { loanService } from '../services/loan.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatCurrency, formatDate } from '../utils/format';

type RecordLoanPaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecordLoanPayment'>;
type RecordLoanPaymentScreenRouteProp = RouteProp<RootStackParamList, 'RecordLoanPayment'>;

interface PaymentSchedule {
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
}

interface Loan {
  _id: string;
  loanName: string;
  paymentSchedule: PaymentSchedule[];
}

const RecordLoanPaymentScreen = () => {
  const navigation = useNavigation<RecordLoanPaymentScreenNavigationProp>();
  const route = useRoute<RecordLoanPaymentScreenRouteProp>();
  const { loanId } = route.params;
  
  // Đảm bảo paymentIndex luôn là số và có giá trị mặc định là 0
  // Nếu route.params.paymentIndex không tồn tại hoặc undefined, sử dụng 0
  const paymentIndex = typeof route.params.paymentIndex === 'number' 
    ? route.params.paymentIndex 
    : (route.params.paymentIndex !== undefined 
        ? parseInt(route.params.paymentIndex as string, 10) 
        : 0);
  
  // Log để debug
  console.log('RecordLoanPaymentScreen - Received params:', { 
    loanId, 
    paymentIndex,
    rawPaymentIndex: route.params.paymentIndex,
    paymentIndexType: typeof route.params.paymentIndex
  });
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLoanDetails();
  }, [loanId]);

  const loadLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await loanService.getLoanDetails(loanId);
      console.log('Loan details response in RecordLoanPaymentScreen:', response);
      
      if (response.success && response.data && response.data.loan) {
        setLoan(response.data.loan);
        
        // Kiểm tra paymentSchedule tồn tại
        if (!response.data.loan.paymentSchedule || response.data.loan.paymentSchedule.length === 0) {
          console.error('No payment schedule found for loan:', loanId);
          setError('This loan has no payment schedule');
          return;
        }
        
        // Đảm bảo paymentIndex nằm trong phạm vi hợp lệ
        const scheduleLength = response.data.loan.paymentSchedule.length;
        let validIndex = paymentIndex;
        
        if (isNaN(validIndex) || validIndex < 0 || validIndex >= scheduleLength) {
          console.warn(`Invalid payment index: ${paymentIndex}, defaulting to first unpaid payment`);
          
          // Tìm khoản thanh toán đầu tiên chưa trả
          validIndex = response.data.loan.paymentSchedule.findIndex(p => !p.isPaid);
          
          // Nếu không tìm thấy khoản thanh toán chưa trả, sử dụng khoản đầu tiên
          if (validIndex === -1) validIndex = 0;
          
          console.log(`Using payment index: ${validIndex} instead`);
        }
        
        // Pre-fill payment amount from schedule
        if (response.data.loan.paymentSchedule[validIndex]) {
          setPaymentAmount(response.data.loan.paymentSchedule[validIndex].amount.toString());
          console.log('Found payment schedule item:', response.data.loan.paymentSchedule[validIndex]);
        } else {
          console.error('Payment schedule or index not found:', validIndex, 'Schedule length:', response.data.loan.paymentSchedule?.length);
          setError(`Payment #${validIndex + 1} not found in schedule`);
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPaymentDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!paymentAmount.trim()) {
      Alert.alert('Error', 'Payment amount is required');
      return false;
    }
    
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Payment amount must be a positive number');
      return false;
    }
    
    return true;
  };

  const handleRecordPayment = async () => {
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      const paymentData = {
        paymentIndex,
        paymentAmount: Number(paymentAmount),
        paymentDate: paymentDate.toISOString()
      };
      
      const response = await loanService.recordLoanPayment(loanId, paymentData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Payment recorded successfully!',
          [{ text: 'OK', onPress: () => navigation.navigate('LoanDetail', { loanId }) }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'An error occurred while recording the payment');
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
          <Text style={styles.headerTitle}>Record Payment</Text>
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
          <Text style={styles.headerTitle}>Record Payment</Text>
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

  if (loan && (!loan.paymentSchedule || !loan.paymentSchedule[paymentIndex])) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Payment</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
            <Text style={styles.errorText}>Payment #{paymentIndex + 1} not found in schedule</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const scheduledPayment = loan?.paymentSchedule?.[paymentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Payment</Text>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <View style={styles.loanInfoSection}>
              <Text style={styles.loanName}>{loan.loanName}</Text>
              <Text style={styles.paymentLabel}>
                Payment #{paymentIndex + 1} {scheduledPayment?.dueDate ? `- Due: ${formatDate(scheduledPayment.dueDate)}` : ''}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter payment amount"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                Scheduled amount: {formatCurrency(scheduledPayment?.amount || 0)}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Date</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(paymentDate.toISOString())}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={paymentDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleRecordPayment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Record Payment</Text>
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
  loanInfoSection: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 16,
  },
  loanName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666',
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
  dateInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#1F41BB',
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

export default RecordLoanPaymentScreen;
