import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { budgetsService } from '../services/budgets.service';
import { categoriesService } from '../services/categories.service';
import { Category } from '../services/categories.service';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

type CreateBudgetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateBudget'>;

const CreateBudgetScreen = () => {
  const navigation = useNavigation<CreateBudgetScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    categoryID: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    startDate: new Date(),
    alertThreshold: '80',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, categoryID: data[0]._id }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.amount || !formData.categoryID) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);

      const budget = {
        ...formData,
        amount: parseFloat(formData.amount),
        alertThreshold: parseInt(formData.alertThreshold, 10),
        startDate: formData.startDate.toISOString(),
      };

      await budgetsService.createBudget(budget);
      Alert.alert('Success', 'Budget created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating budget:', error);
      Alert.alert('Error', 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Budget</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Budget Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter budget name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              value={formData.amount}
              onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
            />
          </View>

          {/* Category Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.categoryID}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, categoryID: value }))}
                style={styles.picker}
              >
                {categories.map((category) => (
                  <Picker.Item 
                    key={category._id} 
                    label={category.categoryName} 
                    value={category._id} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Period Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Period</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.period}
                onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => setFormData(prev => ({ ...prev, period: value }))}
                style={styles.picker}
              >
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Yearly" value="yearly" />
              </Picker>
            </View>
          </View>

          {/* Start Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {format(formData.startDate, 'MMM dd, yyyy')}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="#1F41BB" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFormData(prev => ({ ...prev, startDate: selectedDate }));
                }
              }}
            />
          )}

          {/* Alert Threshold */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Alert Threshold (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter alert threshold"
              keyboardType="number-pad"
              value={formData.alertThreshold}
              onChangeText={(text) => setFormData(prev => ({ ...prev, alertThreshold: text }))}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Budget</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  submitButton: {
    height: 56,
    backgroundColor: '#1F41BB',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateBudgetScreen;
