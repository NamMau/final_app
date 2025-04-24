import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { billsService } from '../services/bills.service';
import { categoriesService, Category } from '../services/categories.service';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(31, 65, 187, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#1F41BB'
  },
  propsForBackgroundLines: {
    strokeWidth: 1,
    stroke: '#e3e3e3',
    strokeDasharray: '0',
  },
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const data = {
  labels: ['1D', '1W', '1M', '3M', '1Y', 'ALL'],
  datasets: [{
    data: [2100, 2400, 2000, 2800, 3000, 2300, 2500],
    color: (opacity = 1) => `rgba(31, 65, 187, ${opacity})`,
    strokeWidth: 2
  }]
};

const categoryData = [
  { name: 'Food & Drink', amount: 1200, percentage: 40 },
  { name: 'Shopping', amount: 800, percentage: 25 },
  { name: 'Transport', amount: 500, percentage: 15 },
  { name: 'Bills', amount: 1023, percentage: 20 },
];

export default function CreateExpenseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [amount, setAmount] = useState('');
  const [billName, setBillName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [billType, setBillType] = useState<'expense' | 'income'>('expense');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await categoriesService.getCategories();
      setCategories(fetchedCategories.filter(cat => cat.type === 'expense' || cat.type === 'both'));
    } catch (error) {
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category._id);
    setSelectedCategoryName(category.categoryName);
    setShowCategoryModal(false);
  };
  
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleScanBill = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsLoading(true);
        setBillType('expense');
        setScannedImage(result.assets[0].uri);

        const scanResult = await billsService.scanBill(result.assets[0].base64);
        if (scanResult.data.bill) {
          const { bill } = scanResult.data;
          setAmount(bill.total.toString());
          setBillName(bill.items[0]?.name || 'Scanned Bill');
          setDescription(bill.items.map(item => `${item.name} x${item.quantity}`).join('\n'));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan bill. Please try again or enter manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBill = async () => {
    try {
      if (!amount || !billName || !selectedCategory) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setIsLoading(true);
      await billsService.createBill({
        userId: '', // This will be set by the backend
        date: selectedDate,
        total: parseFloat(amount),
        items: [],
        status: 'pending',
        type: billType,
        categoryId: selectedCategory,
        image: scannedImage || undefined
      });

      Alert.alert('Success', 'Bill created successfully');
      navigation.goBack();
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
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>Track your spending</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/100' }}
            style={styles.avatar}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1F41BB" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigation.navigate('BillScanner')}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="camera-outline" size={32} color="#1F41BB" />
              </View>
              <Text style={styles.optionTitle}>Scan Bill</Text>
              <Text style={styles.optionDescription}>Take a photo or upload bill image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => navigation.navigate('CreateBill')}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="create-outline" size={32} color="#1F41BB" />
              </View>
              <Text style={styles.optionTitle}>Manual Entry</Text>
              <Text style={styles.optionDescription}>Enter bill details manually</Text>
            </TouchableOpacity>
          </View>

          {/* Expense Amount Section */}
          <View style={styles.expenseCard}>
            <Text style={styles.expenseTitle}>Expenses</Text>
            <Text style={styles.expenseAmount}>${amount || '3,523'}</Text>
            <Text style={styles.expenseSubtitle}>Last 30 Days +12%</Text>
          </View>

          {/* Chart Section */}
          <View style={styles.chartCard}>
            <LineChart
              data={data}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              withInnerLines={true}
              withOuterLines={true}
              withHorizontalLabels={true}
              withVerticalLabels={true}
            />
          </View>

          {/* Bill Details Section */}
          <View style={styles.addExpenseCard}>
            <Text style={styles.sectionTitle}>Bill Details</Text>
            
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
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.dateButtonText}>
                Category: {selectedCategoryName || 'Select Category'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={handleScanBill}
              >
                <Ionicons name="camera" size={24} color="#FFF" />
                <Text style={styles.buttonText}>Scan Bill</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateBill}
              >
                <Text style={styles.buttonText}>Create Bill</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Expenses by Category */}
          <View style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>Expenses by category</Text>
            {categoryData.map((category, index) => (
              <View key={index} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryAmount}>${category.amount}</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${category.percentage}%` }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handleCategorySelect(item)}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name={'folder-outline'} size={24} color={item.color || '#1F41BB'} />
                  </View>
                  <Text style={styles.modalCategoryName}>{item.categoryName}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F41BB',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  notificationButton: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1F41BB',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseTitle: {
    fontSize: 16,
    color: '#666666',
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
    marginVertical: 8,
  },
  expenseSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#666666',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#F0F4FF',
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1F41BB',
    borderRadius: 3,
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
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    color: '#000000',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  scanButton: {
    backgroundColor: '#1F41BB',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  // container: {
  //   flex: 1,
  //   backgroundColor: '#1F41BB',
  // },
  // header: {
  //   padding: 20,
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  // },
  // headerLeft: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   gap: 15,
  // },
  // headerTitle: {
  //   color: '#FFFFFF',
  //   fontSize: 32,
  //   fontWeight: 'bold',
  // },
  // headerSubtitle: {
  //   color: '#FFFFFF',
  //   opacity: 0.8,
  //   fontSize: 16,
  //   marginTop: 4,
  // },
  // headerRight: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   gap: 15,
  // },
  // backButton: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   backgroundColor: 'rgba(255,255,255,0.1)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // notificationButton: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   backgroundColor: 'rgba(255,255,255,0.1)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // avatar: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  // },
  // content: {
  //   flex: 1,
  //   backgroundColor: '#FFFFFF',
  //   borderTopLeftRadius: 30,
  //   borderTopRightRadius: 30,
  // },
  // scrollView: {
  //   flex: 1,
  //   padding: 20,
  // },
  addExpenseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  addExpenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addExpenseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  addExpenseSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
}); 