import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { userService } from '../services/users.service';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface UserData {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  avatar: string;
  dateOfBirth: string;
  createdAt: string;
  accountInfo: {
    accountId: string;
    totalBalance: number;
    currency: string;
  };
}

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await authService.getStoredToken();
        if (!token) return;

        const profile = await userService.getProfile(token);

        const userDataFormatted: UserData = {
          id: profile._id,
          userName: profile.userName,
          email: profile.email,
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          address: profile.address,
          avatar: profile.avatar,
          dateOfBirth: profile.dateOfBirth,
          createdAt: profile.createdAt,
          accountInfo: {
            accountId: profile.accountId,
            totalBalance: profile.totalBalance,
            currency: profile.currency,
          },
        };

        setUserData(userDataFormatted);
        await AsyncStorage.setItem('user', JSON.stringify(userDataFormatted));
      } catch (error) {
        console.error('Error fetching profile', error);
      }
    };
    loadUserData();
  }, []);

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
      currency: 'USD'
    }).format(amount);
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
          <Image source={{uri: userData?.avatar}} style={styles.profileImage}/>
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

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {userData?.accountInfo ? formatCurrency(userData.accountInfo.totalBalance) : '-'}
            </Text>
            <Text style={styles.accountId}>
              Account ID: {userData?.accountInfo?.accountId || '-'}
            </Text>
          </View>
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

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E5E5FF' }]}>
                <Ionicons name="wallet-outline" size={20} color="#1F41BB" />
              </View>
              <Text style={styles.menuText}>My Wallets</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 14, color: '#666' },
  balanceAmount: { fontSize: 24, fontWeight: 'bold', color: '#1F41BB', marginVertical: 8 },
  accountId: { fontSize: 12, color: '#999' },
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
  
});

export default ProfileScreen;
