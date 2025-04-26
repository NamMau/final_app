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
import { goalService } from '../services/goal.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate } from '../utils/format';

type CreateGoalScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateGoal'>;

const CreateGoalScreen = () => {
  const navigation = useNavigation<CreateGoalScreenNavigationProp>();
  
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [targetDate, setTargetDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [type, setType] = useState<'saving' | 'debt' | 'investment'>('saving');
  const [description, setDescription] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showTargetDatePicker, setShowTargetDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!goalName.trim()) {
      newErrors.goalName = 'Goal name is required';
    }
    
    if (!targetAmount.trim()) {
      newErrors.targetAmount = 'Target amount is required';
    } else if (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      newErrors.targetAmount = 'Target amount must be a positive number';
    }
    
    if (initialAmount.trim() && (isNaN(Number(initialAmount)) || Number(initialAmount) < 0)) {
      newErrors.initialAmount = 'Initial amount must be a non-negative number';
    }
    
    if (startDate >= targetDate) {
      newErrors.dates = 'Target date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateGoal = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const goalData = {
        goalName,
        targetAmount: Number(targetAmount),
        startDate: startDate.toISOString(),
        targetDate: targetDate.toISOString(),
        type,
        description,
        initialAmount: initialAmount ? Number(initialAmount) : undefined,
        status: 'active' as 'active'
      };
      
      const response = await goalService.createGoal(goalData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Goal created successfully!',
          [{ text: 'OK', onPress: () => navigation.navigate('Goal') }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'An error occurred while creating the goal');
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

  const onTargetDateChange = (event: any, selectedDate?: Date) => {
    setShowTargetDatePicker(false);
    if (selectedDate) {
      setTargetDate(selectedDate);
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
        <Text style={styles.headerTitle}>Create New Goal</Text>
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Name</Text>
              <TextInput
                style={[styles.input, errors.goalName ? styles.inputError : null]}
                placeholder="Enter goal name"
                value={goalName}
                onChangeText={setGoalName}
              />
              {errors.goalName ? <Text style={styles.errorText}>{errors.goalName}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Amount</Text>
              <TextInput
                style={[styles.input, errors.targetAmount ? styles.inputError : null]}
                placeholder="Enter target amount"
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
              />
              {errors.targetAmount ? <Text style={styles.errorText}>{errors.targetAmount}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Initial Amount (Optional)</Text>
              <TextInput
                style={[styles.input, errors.initialAmount ? styles.inputError : null]}
                placeholder="Enter initial amount"
                value={initialAmount}
                onChangeText={setInitialAmount}
                keyboardType="numeric"
              />
              {errors.initialAmount ? <Text style={styles.errorText}>{errors.initialAmount}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Type</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity 
                  style={[styles.typeButton, type === 'saving' ? styles.typeButtonActive : null]}
                  onPress={() => setType('saving')}
                >
                  <Text style={[styles.typeButtonText, type === 'saving' ? styles.typeButtonTextActive : null]}>Saving</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeButton, type === 'debt' ? styles.typeButtonActive : null]}
                  onPress={() => setType('debt')}
                >
                  <Text style={[styles.typeButtonText, type === 'debt' ? styles.typeButtonTextActive : null]}>Debt</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeButton, type === 'investment' ? styles.typeButtonActive : null]}
                  onPress={() => setType('investment')}
                >
                  <Text style={[styles.typeButtonText, type === 'investment' ? styles.typeButtonTextActive : null]}>Investment</Text>
                </TouchableOpacity>
              </View>
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
              <Text style={styles.label}>Target Date</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowTargetDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(targetDate.toISOString())}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              {showTargetDatePicker && (
                <DateTimePicker
                  value={targetDate}
                  mode="date"
                  display="default"
                  onChange={onTargetDateChange}
                />
              )}
              {errors.dates ? <Text style={styles.errorText}>{errors.dates}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter goal description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateGoal}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Goal</Text>
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
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: '#1F41BB',
    borderColor: '#1F41BB',
  },
  typeButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
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

export default CreateGoalScreen;
