import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loanService } from '../services/loan.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate } from '../utils/format';

type CreateLoanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateLoan'>;

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
    
    try {
      setLoading(true);
      
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
      
      const response = await loanService.createLoanWithGoal(loanData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Loan created successfully with repayment goal!',
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
});

export default CreateLoanScreen;
