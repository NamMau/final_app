import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loanService } from '../services/loan.service';
import { goalService } from '../services/goal.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate, formatCurrency } from '../utils/format';

type CreateLoanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateLoan'>;

// Interface for Goal
interface Goal {
  _id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  type: string;
  status: string;
}

const CreateLoanScreen = () => {
  const navigation = useNavigation<CreateLoanScreenNavigationProp>();
  
  const [loanName, setLoanName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [description, setDescription] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Thêm state cho việc chọn mục tiêu
  const [createNewGoal, setCreateNewGoal] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([]);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);

  // Tải danh sách mục tiêu khi màn hình được mở
  useEffect(() => {
    fetchAvailableGoals();
  }, []);

  // Lấy danh sách mục tiêu hiện có
  const fetchAvailableGoals = async () => {
    try {
      setLoadingGoals(true);
      const response = await goalService.getUserGoals();
      if (response.success && response.data?.goals) {
        // Chỉ lấy các mục tiêu đang hoạt động và có loại là debt hoặc saving
        const activeGoals = response.data.goals.filter(
          goal => goal.status === 'active' && (goal.type === 'debt' || goal.type === 'saving')
        );
        setAvailableGoals(activeGoals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!loanName.trim()) {
      newErrors.loanName = 'Loan name is required';
    }
    
    if (!loanAmount.trim()) {
      newErrors.loanAmount = 'Loan amount is required';
    } else if (isNaN(Number(loanAmount)) || Number(loanAmount) <= 0) {
      newErrors.loanAmount = 'Loan amount must be a positive number';
    }
    
    if (!interestRate.trim()) {
      newErrors.interestRate = 'Interest rate is required';
    } else if (isNaN(Number(interestRate)) || Number(interestRate) < 0) {
      newErrors.interestRate = 'Interest rate must be a non-negative number';
    }
    
    if (startDate >= endDate) {
      newErrors.dates = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateLoan = async () => {
    if (!validateForm()) return;
    
    // Kiểm tra nếu chọn mục tiêu hiện có nhưng chưa chọn mục tiêu nào
    if (!createNewGoal && !selectedGoalId) {
      setErrors({...errors, goal: 'Please select a goal'});
      return;
    }
    
    try {
      setLoading(true);
      
      let response;
      
      // Tính toán monthlyPayment nếu chưa được nhập
      // Công thức đơn giản: khoản vay / số tháng
      const loanDurationMonths = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (30 * 24 * 60 * 60 * 1000)));
      const calculatedMonthlyPayment = Number(loanAmount) / loanDurationMonths;
      
      if (createNewGoal) {
        // Tạo khoản vay với mục tiêu mới
        const loanData = {
          loanName,
          loanAmount: Number(loanAmount),
          interestRate: Number(interestRate),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          description,
          goalName: `Repayment for ${loanName}`,
          goalType: 'debt' as 'debt',
          goalDescription: `Goal for repaying ${loanName} loan`
        };
        
        response = await loanService.createLoanWithGoal(loanData);
      } else {
        // Đảm bảo selectedGoalId không null trước khi gửi
        if (!selectedGoalId) {
          Alert.alert('Error', 'Please select a goal');
          setLoading(false);
          return;
        }
        
        // Tạo khoản vay với mục tiêu hiện có
        const loanData = {
          loanName,
          loanAmount: Number(loanAmount),
          remainingBalance: Number(loanAmount), // Thêm remainingBalance
          interestRate: Number(interestRate),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          description,
          goalID: selectedGoalId, // Đã đảm bảo không null
          monthlyPayment: calculatedMonthlyPayment, // Thêm monthlyPayment
          paymentSchedule: [] // Thêm paymentSchedule rỗng
        };
        
        console.log('Creating loan with data:', loanData);
        response = await loanService.createLoan(loanData);
      }
      
      if (response.success) {
        Alert.alert(
          'Success',
          createNewGoal 
            ? 'Loan created successfully with repayment goal!' 
            : 'Loan created successfully and linked to existing goal!',
          [{ text: 'OK', onPress: () => navigation.navigate('Loan') }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create loan');
      }
    } catch (error) {
      console.error('Error creating loan:', error);
      Alert.alert('Error', 'An error occurred while creating the loan');
    } finally {
      setLoading(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
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
        <Text style={styles.headerTitle}>Create New Loan</Text>
      </View>
      
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loan Name</Text>
              <TextInput
                style={[styles.input, errors.loanName ? styles.inputError : null]}
                placeholder="Enter loan name"
                value={loanName}
                onChangeText={setLoanName}
              />
              {errors.loanName ? <Text style={styles.errorText}>{errors.loanName}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Loan Amount</Text>
              <TextInput
                style={[styles.input, errors.loanAmount ? styles.inputError : null]}
                placeholder="Enter loan amount"
                value={loanAmount}
                onChangeText={setLoanAmount}
                keyboardType="numeric"
              />
              {errors.loanAmount ? <Text style={styles.errorText}>{errors.loanAmount}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Interest Rate (%)</Text>
              <TextInput
                style={[styles.input, errors.interestRate ? styles.inputError : null]}
                placeholder="Enter interest rate"
                value={interestRate}
                onChangeText={setInterestRate}
                keyboardType="numeric"
              />
              {errors.interestRate ? <Text style={styles.errorText}>{errors.interestRate}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(startDate.toISOString())}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={onStartDateChange}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(endDate.toISOString())}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={onEndDateChange}
                />
              )}
              {errors.dates ? <Text style={styles.errorText}>{errors.dates}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter loan description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Goal Selection Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Options</Text>
              
              <View style={styles.goalOptions}>
                <TouchableOpacity 
                  style={[
                    styles.goalOption, 
                    createNewGoal && styles.selectedGoalOption
                  ]}
                  onPress={() => setCreateNewGoal(true)}
                >
                  <Ionicons 
                    name={createNewGoal ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={createNewGoal ? "#1F41BB" : "#666"} 
                  />
                  <Text style={styles.goalOptionText}>Create new repayment goal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.goalOption, 
                    !createNewGoal && styles.selectedGoalOption
                  ]}
                  onPress={() => setCreateNewGoal(false)}
                >
                  <Ionicons 
                    name={!createNewGoal ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={!createNewGoal ? "#1F41BB" : "#666"} 
                  />
                  <Text style={styles.goalOptionText}>Link to existing goal</Text>
                </TouchableOpacity>
              </View>
              
              {!createNewGoal && (
                <View style={styles.existingGoalSection}>
                  <TouchableOpacity 
                    style={styles.goalSelector}
                    onPress={() => setShowGoalSelector(true)}
                  >
                    {selectedGoalId ? (
                      <Text style={styles.selectedGoalText}>
                        {availableGoals.find(g => g._id === selectedGoalId)?.goalName || 'Selected Goal'}
                      </Text>
                    ) : (
                      <Text style={styles.goalSelectorText}>Select a goal</Text>
                    )}
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  {errors.goal ? <Text style={styles.errorText}>{errors.goal}</Text> : null}
                  
                  {availableGoals.length === 0 && !loadingGoals && (
                    <Text style={styles.noGoalsText}>
                      No active goals available. Create a new goal instead.
                    </Text>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateLoan}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Loan</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      
      {/* Goal Selector Modal */}
      <Modal
        visible={showGoalSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Goal</Text>
              <TouchableOpacity onPress={() => setShowGoalSelector(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {loadingGoals ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1F41BB" />
                <Text style={styles.loadingText}>Loading goals...</Text>
              </View>
            ) : availableGoals.length > 0 ? (
              <FlatList
                data={availableGoals}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.goalItem,
                      selectedGoalId === item._id && styles.selectedGoalItem
                    ]}
                    onPress={() => {
                      setSelectedGoalId(item._id);
                      setShowGoalSelector(false);
                    }}
                  >
                    <View style={styles.goalItemContent}>
                      <View style={styles.goalItemIconContainer}>
                        <Ionicons 
                          name={item.type === 'debt' ? "trending-down" : "trending-up"} 
                          size={24} 
                          color={item.type === 'debt' ? "#F44336" : "#4CAF50"} 
                        />
                      </View>
                      <View style={styles.goalItemDetails}>
                        <Text style={styles.goalItemName}>{item.goalName}</Text>
                        <Text style={styles.goalItemAmount}>
                          Target: {formatCurrency(item.targetAmount)}
                        </Text>
                        <Text style={styles.goalItemProgress}>
                          Progress: {Math.round((item.currentAmount / item.targetAmount) * 100)}%
                        </Text>
                      </View>
                      {selectedGoalId === item._id && (
                        <Ionicons name="checkmark-circle" size={24} color="#1F41BB" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyGoalsContainer}>
                <Ionicons name="sad-outline" size={48} color="#ccc" />
                <Text style={styles.emptyGoalsText}>No active goals available</Text>
                <TouchableOpacity 
                  style={styles.createGoalButton}
                  onPress={() => {
                    setShowGoalSelector(false);
                    setCreateNewGoal(true);
                  }}
                >
                  <Text style={styles.createGoalButtonText}>Create New Goal Instead</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  createButton: {
    backgroundColor: '#1F41BB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  goalOptions: {
    marginBottom: 16,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  selectedGoalOption: {
    backgroundColor: 'rgba(31, 65, 187, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  goalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  existingGoalSection: {
    marginTop: 8,
  },
  goalSelector: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalSelectorText: {
    fontSize: 16,
    color: '#999',
  },
  selectedGoalText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  noGoalsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#F44336',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  goalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  selectedGoalItem: {
    backgroundColor: 'rgba(31, 65, 187, 0.05)',
  },
  goalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalItemDetails: {
    flex: 1,
  },
  goalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalItemAmount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  goalItemProgress: {
    fontSize: 14,
    color: '#1F41BB',
  },
  emptyGoalsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyGoalsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
  },
  createGoalButton: {
    backgroundColor: '#1F41BB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createGoalButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default CreateLoanScreen;
