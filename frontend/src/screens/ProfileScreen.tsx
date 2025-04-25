import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { userService } from '../services/users.service';
import { API_URL } from '../config/constants';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface UserData {
  _id: string;
  userName: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  avatar: string;
  dateOfBirth: string;
  createdAt: string;
  accountId?: string;
  totalBalance?: number;
  currency?: string;
}

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  const loadUserData = async () => {
    try {
      console.log('Starting to load user data...');
      const token = await authService.getStoredToken();
      console.log('Token status:', token ? 'Token exists' : 'No token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      console.log('Fetching profile data...');
      const profile = await userService.getProfile();
      console.log('Profile response:', profile);
      console.log('Avatar URL:', profile.avatar);
      
      if(!profile){
        console.warn('Profile is undefined!');
        return;
      }

      console.log('Processing profile data:', profile);
      const userDataFormatted: UserData = {
        _id: profile._id,
        userName: profile.userName,
        email: profile.email,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        avatar: profile.avatar,
        dateOfBirth: profile.dateOfBirth,
        createdAt: profile.createdAt,
        accountId: profile.accountId || '',
        totalBalance: profile.totalBalance || 0,
        currency: profile.currency || 'USD'
      };

      console.log('Formatted user data:', userDataFormatted);
      setUserData(userDataFormatted);
      await AsyncStorage.setItem('user', JSON.stringify(userDataFormatted));
      console.log('User data saved successfully');
    } catch (error: any) {
      console.error('Error in loadUserData:', error);
      if (error.message) {
        console.error('Error message:', error.message);
      }
      // Clear user data on error to prevent showing stale data
      setUserData(null);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Listen for balance updates from other screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = navigation.getState().routes.find(r => r.name === 'Profile')?.params;
      if (params && 'balanceUpdated' in params && params.balanceUpdated) {
        loadUserData();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleUpdateBalance = async (newBalance: number) => {
    try {
      const updatedUser = await userService.updateBalance({
        totalBalance: newBalance,
        currency: 'VND'
      });
      if (updatedUser) {
        setUserData(prevData => ({
          ...prevData!,
          totalBalance: updatedUser.totalBalance,
          currency: updatedUser.currency
        }));
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image 
            source={{
              uri: userData?.avatar 
                ? `${API_URL}/${userData.avatar.replace(/^\//, '')}` 
                : 'https://www.gravatar.com/avatar/default?s=200'
            }} 
            style={styles.profileImage}
          />
          {userData?.fullName ? (
            <View style={[styles.profileImage, styles.defaultAvatarContainer]}>
              <Text style={styles.defaultAvatarText}>
                {userData.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : null}
          <Text style={styles.userName}>{userData?.fullName || 'Loading...'}</Text>
          <Text style={styles.userEmail}>{userData?.email || ''}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{userData?.userName || '-'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{userData?.phoneNumber || '-'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{userData?.address || '-'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>
              {userData?.dateOfBirth ? formatDate(userData.dateOfBirth) : '-'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {userData?.createdAt ? formatDate(userData.createdAt) : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Account Balance</Text>

          <TouchableOpacity 
            style={styles.balanceCard}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Alert.prompt(
                  'Update Balance',
                  'Enter your new balance:',
                  [{
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Update',
                    onPress: (value) => {
                      if (value && !isNaN(Number(value))) {
                        handleUpdateBalance(Number(value));
                      }
                    }
                  }],
                  'plain-text',
                  '',
                  'number-pad'
                );
              } else {
                setModalVisible(true);
              }
            }}
          >
            <View style={styles.balanceCardContent}>
              <Text style={styles.balanceLabel}>Total Balance (tap to update)</Text>
            <Text style={styles.balanceAmount}>
              {userData?.totalBalance !== undefined ? formatCurrency(userData.totalBalance) : '-'}
            </Text>
            {userData?.accountId && (
                <Text style={styles.accountId}>Account ID: {userData.accountId}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F3FF' }]}>
                <Ionicons name="qr-code-outline" size={20} color="#1F41BB" />
              </View>
              <Text style={styles.menuText}>QR Code</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF2E2' }]}>
                <Ionicons name="create-outline" size={20} color="#1F41BB" />
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Alert.prompt(
                  'Update Balance',
                  'Enter your new balance:',
                  [{
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Update',
                    onPress: (value) => {
                      if (value && !isNaN(Number(value))) {
                        handleUpdateBalance(Number(value));
                      }
                    }
                  }],
                  'plain-text',
                  '',
                  'number-pad'
                );
              } else {
                setModalVisible(true);
              }
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E5E5FF' }]}>
                <Ionicons name="wallet-outline" size={20} color="#1F41BB" />
              </View>
              <Text style={styles.menuText}>Update Balance</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.balanceText}>
                {userData?.totalBalance ? formatCurrency(userData.totalBalance) : '0 VND'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFE8E8' }]}>
                <Ionicons name="settings-outline" size={20} color="#1F41BB" />
              </View>
              <Text style={styles.menuText}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFE8E8' }]}>
                <Ionicons name="log-out-outline" size={20} color="#FF4B55" />
              </View>
              <Text style={[styles.menuText, { color: '#FF4B55' }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF4B55" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Balance</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="Enter new balance"
              value={newBalance}
              onChangeText={setNewBalance}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewBalance('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.updateButton]}
                onPress={() => {
                  if (newBalance && !isNaN(Number(newBalance))) {
                    handleUpdateBalance(Number(newBalance));
                    setModalVisible(false);
                    setNewBalance('');
                  }
                }}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  updateButton: {
    backgroundColor: '#1F41BB',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  settingsButton: { padding: 8 },
  content: { flex: 1 },
  profileSection: { alignItems: 'center', paddingVertical: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  userEmail: { fontSize: 16, color: '#666' },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 8,
    borderTopColor: '#F5F5F5',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  infoItem: { marginBottom: 16 },
  infoLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#000' },
  balanceCard: {
    backgroundColor: '#1F41BB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  balanceCardContent: {
    flex: 1,
  },
  balanceLabel: { fontSize: 14, color: '#666' },
  balanceAmount: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginVertical: 8 },
  accountId: { fontSize: 12, color: '#FFFFFF' },
  menuSection: { paddingHorizontal: 20, paddingVertical: 16 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: { fontSize: 16, color: '#000' },
  logoutButton: { marginTop: 20 },
  defaultAvatarContainer: {
    backgroundColor: '#7c8a97', // Màu nền cho avatar mặc định
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  balanceText: {
    fontSize: 16,
    color: '#1F41BB',
    fontWeight: '600'
  }
});

export default ProfileScreen;
