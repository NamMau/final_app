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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { billsService, BillResponse } from '../services/bills.service';
import { budgetsService, Budget } from '../services/budgets.service';
import { Category } from '../services/categories.service';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddBill'>;

export default function AddBillScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [billName, setBillName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedBudgetName, setSelectedBudgetName] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetDetails, setBudgetDetails] = useState<{
    spent: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const fetchedBudgets = await budgetsService.getBudgets();
      setBudgets(fetchedBudgets.filter(budget => budget.isActive));
    } catch (error) {
      Alert.alert('Error', 'Failed to load budgets');
    }
  };

  const handleBudgetSelect = (budget: Budget) => {
    setSelectedBudget(budget._id);
    const category = budget.categoryID as Category;
    setSelectedBudgetName(`${budget.name} (${category.categoryName})`);
    setBudgetDetails({
      spent: budget.spent,
      total: budget.amount,
      percentage: (budget.spent / budget.amount) * 100
    });
    setShowBudgetModal(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const createBillWithForce = async () => {
    try {
      setIsLoading(true);
      const forceResult = await billsService.createBill({
        billName,
        amount: Number(amount),
        dueDate: selectedDate.toISOString(),
        type: 'manual',
        budget: selectedBudget,
        ...(description && { description }),
        ...(location && { location }),
        forceCreate: true // Force create bill even if it exceeds budget threshold
      }) as BillResponse;

      if (forceResult.success) {
        Alert.alert('Success', 'Bill created successfully despite budget threshold');
        navigation.goBack();
      } else {
        Alert.alert('Error', forceResult.message || 'Failed to create bill');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to force create bill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!billName || !amount || !selectedDate || !selectedBudget) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const result = await billsService.createBill({
        billName,
        amount: Number(amount),
        dueDate: selectedDate.toISOString(),
        type: 'manual',
        budget: selectedBudget,
        ...(description && { description }),
        ...(location && { location }),
      }) as BillResponse;

      if (!result.success && result.budgetDetails) {
        // Set isLoading to false before showing the alert
        setIsLoading(false);
        
        Alert.alert(
          'Budget Warning',
          `Adding this bill will exceed the budget threshold (${result.budgetDetails.threshold}%).

Current spent: ${result.budgetDetails.currentSpent}
Budget amount: ${result.budgetDetails.budgetAmount}
New percentage: ${result.budgetDetails.percentage.toFixed(1)}%

Do you want to proceed?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Proceed',
              style: 'destructive',
              onPress: createBillWithForce
            }
          ]
        );
      } else {
        Alert.alert('Success', 'Bill created successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create bill');
    } finally {
      setIsLoading(false);
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
          <View>
            <Text style={styles.headerTitle}>Add Bill</Text>
            <Text style={styles.headerSubtitle}>Enter bill details</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Bill Name"
              value={billName}
              onChangeText={setBillName}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowBudgetModal(true)}
            >
              <Text style={styles.inputText}>
                Budget: {selectedBudgetName || 'Select Budget'}
              </Text>
            </TouchableOpacity>

            {budgetDetails && (
              <View style={styles.budgetInfo}>
                <Text style={styles.budgetText}>
                  Budget used: {budgetDetails.spent.toLocaleString()} / {budgetDetails.total.toLocaleString()} ({budgetDetails.percentage.toFixed(1)}%)
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { 
                      width: `${Math.min(budgetDetails.percentage, 100)}%`,
                      backgroundColor: budgetDetails.percentage > 80 ? '#FF4444' : '#1F41BB'
                    }]} 
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>
                Due Date: {selectedDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                onChange={handleDateChange}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Location (optional)"
              value={location}
              onChangeText={setLocation}
            />

            {/* <View style={styles.tagsContainer}>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.input, styles.tagInput]}
                  placeholder="Add tags (optional)"
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={handleAddTag}
                >
                  <Ionicons name="add" size={24} color="#1F41BB" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsList}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(tag)}
                      style={styles.removeTagButton}
                    >
                      <Ionicons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View> */}

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Bill</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Budget Selection Modal */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Budget</Text>
            <FlatList
              data={budgets}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.budgetItem}
                  onPress={() => handleBudgetSelect(item)}
                >
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName}>{item.name}</Text>
                    <Text style={styles.categoryName}>
                      {typeof item.categoryID === 'string' 
                        ? item.categoryID 
                        : item.categoryID.categoryName}
                    </Text>
                    <View style={styles.budgetProgress}>
                      <Text style={styles.budgetText}>
                        {item.spent.toLocaleString()} / {item.amount.toLocaleString()} ({((item.spent / item.amount) * 100).toFixed(1)}%)
                      </Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[styles.progressFill, { 
                            width: `${Math.min((item.spent / item.amount) * 100, 100)}%`,
                            backgroundColor: (item.spent / item.amount) * 100 > 80 ? '#FF4444' : '#1F41BB'
                          }]} 
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBudgetModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F41BB" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  budgetInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  budgetText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  budgetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  budgetProgress: {
    marginTop: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1F41BB',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  inputText: {
    fontSize: 16,
    color: '#000000',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  addTagButton: {
    padding: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAED',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    fontSize: 14,
    marginRight: 4,
  },
  removeTagButton: {
    padding: 2,
  },

  createButton: {
    backgroundColor: '#1F41BB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalCategoryName: {
    fontSize: 16,
    color: '#000000',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#1F41BB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
