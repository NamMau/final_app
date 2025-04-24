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
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { budgetsService } from '../services/budgets.service';
import { categoriesService } from '../services/categories.service';
import { Category } from '../services/categories.service';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

type UpdateBudgetScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UpdateBudget'>;
type UpdateBudgetScreenRouteProp = RouteProp<RootStackParamList, 'UpdateBudget'>;

const UpdateBudgetScreen = () => {
  const navigation = useNavigation<UpdateBudgetScreenNavigationProp>();
  const route = useRoute<UpdateBudgetScreenRouteProp>();
  const { budget } = route.params;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  const [formData, setFormData] = useState({
    name: budget.name,
    amount: budget.amount.toString(),
    categoryID: budget.categoryID,
    period: budget.period,
    startDate: new Date(budget.startDate),
    alertThreshold: budget.alertThreshold.toString(),
    isActive: budget.isActive,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
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

      const updatedBudget = {
        ...formData,
        amount: parseFloat(formData.amount),
        alertThreshold: parseInt(formData.alertThreshold, 10),
        startDate: formData.startDate.toISOString(),
      };

      await budgetsService.updateBudget(budget._id, updatedBudget);
      Alert.alert('Success', 'Budget updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating budget:', error);
      Alert.alert('Error', 'Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await budgetsService.deleteBudget(budget._id);
      Alert.alert('Success', 'Budget deleted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error deleting budget:', error);
      Alert.alert('Error', 'Failed to delete budget');
    } finally {
      setDeleting(false);
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
          <Text style={styles.headerTitle}>Update Budget</Text>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          {/* Status Toggle */}
          <View style={styles.statusContainer}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  formData.isActive && styles.statusButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, isActive: true }))}
              >
                <Text style={[
                  styles.statusButtonText,
                  formData.isActive && styles.statusButtonTextActive
                ]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  !formData.isActive && styles.statusButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, isActive: false }))}
              >
                <Text style={[
                  styles.statusButtonText,
                  !formData.isActive && styles.statusButtonTextActive
                ]}>Paused</Text>
              </TouchableOpacity>
            </View>
          </View>

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

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {categories.find(c => c._id === formData.categoryID)?.categoryName || 'Select Category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Period */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Period</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowPeriodModal(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {formData.period.charAt(0).toUpperCase() + formData.period.slice(1)}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
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

          {/* Progress Info */}
          <View style={styles.progressInfo}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Spent</Text>
              <Text style={styles.progressValue}>${budget.spent.toFixed(2)}</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Remaining</Text>
              <Text style={[
                styles.progressValue,
                budget.isOverBudget ? styles.overBudget : styles.underBudget
              ]}>
                ${(budget.amount - budget.spent).toFixed(2)}
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={[
                styles.progressValue,
                budget.isOverBudget ? styles.overBudget : 
                budget.isNearThreshold ? styles.nearThreshold : styles.underBudget
              ]}>
                {Math.round(budget.progress || 0)}%
              </Text>
            </View>
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
              <Text style={styles.submitButtonText}>Update Budget</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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
                  setFormData(prev => ({ ...prev, period: period.toLowerCase() as 'weekly' | 'monthly' | 'yearly' }));
                  setShowPeriodModal(false);
                }}
              >
                <Text>{period}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
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
  deleteButton: {
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
  statusContainer: {
    marginBottom: 20,
  },
  statusButtons: {
    flexDirection: 'row',
    backgroundColor: '#F1F4FF',
    borderRadius: 8,
    padding: 4,
  },
  statusButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  statusButtonActive: {
    backgroundColor: '#1F41BB',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F41BB',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
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
  dropdownButton: {
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
  dropdownButtonText: {
    fontSize: 16,
    color: '#333333',
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  overBudget: {
    color: '#DC2626',
  },
  nearThreshold: {
    color: '#F59E0B',
  },
  underBudget: {
    color: '#059669',
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

export default UpdateBudgetScreen;
