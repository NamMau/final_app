import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { billsService, Bill, BillItem } from '../services/bills.service';
import { userService } from '../services/users.service';

type BillScannerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BillScanner'>;

export default function BillScannerScreen() {
  const navigation = useNavigation<BillScannerScreenNavigationProp>();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedBill, setScannedBill] = useState<Bill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  useEffect(() => {
    loadBills();
    loadUserBalance();
  }, []);

  const loadBills = async () => {
    try {
      setLoadingBills(true);
      const response = await billsService.getBills();
      console.log('API Response:', response);
      if (Array.isArray(response)) {
        setBills(response);
        console.log('Bills set:', response);
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Error loading bills:', err);
      setError('Failed to load bills');
    } finally {
      setLoadingBills(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setImage(result.assets[0].base64);
        setError(null);
        scanBill(result.assets[0].base64);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image');
    }
  };

  const scanBill = async (base64Image: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await billsService.scanBill(base64Image);
      setScannedBill(response.data.bill);
    } catch (err) {
      console.error('Error scanning bill:', err);
      setError('Failed to scan bill');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const handleManualEntry = () => {
    navigation.navigate('AddBill');
  };

  const loadUserBalance = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserBalance(user.totalBalance || 0);
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  const handlePayBill = async (bill: Bill) => {
    if (userBalance < bill.amount) {
      Alert.alert('Error', 'Insufficient balance to pay this bill');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Are you want to pay ${formatCurrency(bill.amount)} for this bill?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              setLoading(true);
              
              // 1. Update bill status
              await billsService.updateBillStatus(bill._id, 'paid');

              // 2. Update user balance in both API and AsyncStorage
              const userData = await AsyncStorage.getItem('user');
              if (userData) {
                const user = JSON.parse(userData);
                const newBalance = (user.totalBalance || 0) - bill.amount;

                // Update balance in API first
                await userService.updateBalance({
                  totalBalance: newBalance,
                });

                // Then update in AsyncStorage
                user.totalBalance = newBalance;
                await AsyncStorage.setItem('user', JSON.stringify(user));
                setUserBalance(newBalance);

                // Notify other screens about balance update
                navigation.navigate({
                  name: 'Profile',
                  params: { balanceUpdated: true }
                });
                navigation.navigate({
                  name: 'Dashboard',
                  params: { balanceUpdated: true }
                });
              }

              // 3. Reload bills
              loadBills();

              Alert.alert('Success', 'Bill paid successfully');
            } catch (error) {
              console.error('Error paying bill:', error);
              Alert.alert('Error', 'Failed to process payment');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Bills</Text>
            <Text style={styles.headerSubtitle}>Scan or add bills</Text>
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
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionCard} onPress={pickImage}>
              <View style={styles.optionIcon}>
                <Ionicons name="camera" size={24} color="#1F41BB" />
              </View>
              <Text style={styles.optionTitle}>Scan Bill</Text>
              <Text style={styles.optionDescription}>Take a photo or upload bill image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard} onPress={handleManualEntry}>
              <View style={styles.optionIcon}>
                <Ionicons name="create" size={24} color="#1F41BB" />
              </View>
              <Text style={styles.optionTitle}>Manual Entry</Text>
              <Text style={styles.optionDescription}>Enter bill details manually</Text>
            </TouchableOpacity>
          </View>

          {image && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Bill Preview</Text>
              <Image
                source={{ uri: `data:image/jpeg;base64,${image}` }}
                style={styles.previewImage}
              />
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1F41BB" />
              <Text style={styles.loadingText}>Scanning bill...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={24} color="#c62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* {scannedBill && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Scanned Bill Details</Text>
              <Text style={styles.resultDate}>Date: {formatDate(scannedBill.date)}</Text>
              
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>Items:</Text>
                {scannedBill.items.map((item: BillItem, index: number) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrency(scannedBill.total)}
                </Text>
              </View>
            </View>
          )}

          {/* Recent Bills */}
          <View style={styles.recentBillsContainer}>
            <Text style={styles.sectionTitle}>Recent Bills</Text>
            {loadingBills ? (
              <ActivityIndicator size="large" color="#1F41BB" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : bills.length === 0 ? (
              <Text style={styles.emptyText}>No bills found</Text>
            ) : (
              bills.map((bill) => (
                <TouchableOpacity 
                  key={bill._id} 
                  style={[styles.billCard, { opacity: bill.status === 'paid' ? 0.6 : 1 }]}
                  onPress={() => bill.status === 'unpaid' && handlePayBill(bill)}
                >
                  <View style={styles.billHeader}>
                    <Text style={styles.billName}>{bill.billName}</Text>
                    <Text style={[styles.billStatus, { color: bill.status === 'paid' ? '#4CAF50' : '#FF9800' }]}>
                      {bill.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.billAmount}>{formatCurrency(bill.amount)}</Text>
                  <Text style={styles.billDate}>{formatDate(new Date(bill.dueDate))}</Text>
                  {bill.location && <Text style={styles.billLocation}>{bill.location}</Text>}
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  recentBillsContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  billCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  billName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F41BB',
  },
  billDate: {
    fontSize: 14,
    color: '#666666',
  },
  billLocation: {
    fontSize: 14,
    color: '#666666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    marginTop: 16,
  },
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    opacity: 0.8,
    fontSize: 16,
    marginTop: 4,
  },
  headerRight: {
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  resultDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F41BB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F41BB',
  },
}); 