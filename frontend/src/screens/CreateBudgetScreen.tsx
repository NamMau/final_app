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
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { budgetsService } from '../services/budgets.service';
import { categoriesService } from '../services/categories.service';
import { Category } from '../services/categories.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

type Period = 'weekly' | 'monthly' | 'yearly';

interface FormData {
  name: string;
  amount: string;
  categoryID: string;
  period: Period;
  startDate: Date;
  alertThreshold: string;
}

type CreateBudgetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateBudget'>;

const CreateBudgetScreen = () => {
  const navigation = useNavigation<CreateBudgetScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    amount: '',
    categoryID: '',
    period: 'monthly',
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

      // Calculate endDate based on period
      const startDate = formData.startDate;
      let endDate = new Date(startDate);
      switch (formData.period) {
        case 'weekly':
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(startDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(startDate.getFullYear() + 1);
          break;
      }

      const budget = {
        ...formData,
        amount: parseFloat(formData.amount),
        alertThreshold: parseInt(formData.alertThreshold, 10),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      await budgetsService.createBudget(budget);
      Alert.alert('Success', 'Budget created successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Budget', { refresh: true }) }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Budget</Text>
        </View>

        <View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Budget Name</Text>
              <TextInput
                placeholder="Enter budget name"
                value={formData.name}
                onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                style={styles.input}
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  placeholder="0.00"
                  value={formData.amount}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                  keyboardType="numeric"
                  style={[styles.input, styles.amountInput]}
                  placeholderTextColor="#A0A0A0"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {formData.categoryID
                    ? categories.find(cat => cat._id === formData.categoryID)?.categoryName
                    : 'Select a category...'}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Period</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowPeriodModal(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {formData.period.charAt(0).toUpperCase() + formData.period.slice(1)}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {format(formData.startDate, 'MMM dd, yyyy')}
                </Text>
                <Ionicons name="calendar-outline" size={24} color="#1F41BB" />
              </TouchableOpacity>
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
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Alert Threshold (%)</Text>
              <TextInput
                placeholder="Enter alert threshold..."
                value={formData.alertThreshold}
                onChangeText={(value) => setFormData(prev => ({ ...prev, alertThreshold: value }))}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Budget</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Category Modal */}
        <Modal visible={showCategoryModal} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <ScrollView>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={styles.modalItem}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, categoryID: category._id }));
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text>{category.categoryName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* Period Modal */}
        <Modal visible={showPeriodModal} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShowPeriodModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Period</Text>
              {['Weekly', 'Monthly', 'Yearly'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, period: period.toLowerCase() as Period }));
                    setShowPeriodModal(false);
                  }}
                >
                  <Text>{period}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateBudgetScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardAvoidingView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F41BB',
    padding: 16,
  },
  backButton: { marginRight: 12 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  scrollView: { flexGrow: 1 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 16, marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  currencySymbol: { marginRight: 5, fontSize: 16, color: '#555' },
  amountInput: { flex: 1 },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: { fontSize: 16, color: '#000' },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  dateText: { fontSize: 16, color: '#000' },
  submitButton: {
    backgroundColor: '#1F41BB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000050',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
