import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../services/api';
import { ENDPOINTS } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SuccessRegister from '../components/SuccessRegister';
import * as ImagePicker from 'expo-image-picker';
import {Image} from 'react-native';
import { RegisterResponse } from '../services/auth.service';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;


const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [userName, setUserName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessRegister, setShowSuccessRegister] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const pickImage = async () =>{
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library.');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true
    });
  
    if (!result.canceled && result.assets.length > 0) {
      const picked = result.assets[0];
      if (picked.base64) {
        // Store both URI for display and base64 for upload
        setAvatar(picked.base64);
        console.log('Image selected and converted to base64');
      } else {
        Alert.alert('Error', 'Could not get image data');
      }
    }
  }

  const handleRegister = async () => {
    if (!userName || !fullName || !email || !password || !phoneNumber || !address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }
    

    try {
      setIsLoading(true);
      // Create registration data
      const registrationData = {
        userName,
        fullName,
        email,
        password,
        dateOfBirth: dateOfBirth.toISOString(),
        phoneNumber,
        address,
        avatar: avatar || undefined
      };

      console.log('Sending registration data:', registrationData);
      const response = await apiService.post<RegisterResponse>(ENDPOINTS.AUTH.REGISTER, registrationData);

      if (response.success && response.data) {
        // Lưu token và dữ liệu người dùng vào AsyncStorage
                // Lưu token và dữ liệu người dùng vào AsyncStorage
        await AsyncStorage.setItem('accessToken', response.data.accessToken); // Access through data
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken); // Access through data
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user)); // Access through data
        await AsyncStorage.setItem('account', JSON.stringify(response.data.account)); // Access through data
      
        setShowSuccessRegister(true);
        setTimeout(() => {
          setShowSuccessRegister(false);
          navigation.replace('Login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'An error occurred during registration'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SuccessRegister 
        visible={showSuccessRegister} 
        onClose={() => setShowSuccessRegister(false)}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Create an account so you can manage your finance</Text>

        <TouchableOpacity 
          style={styles.avatarPicker}
          onPress={pickImage}
          disabled={isLoading}
        >
          {avatar ? (
            <Image source={{ uri: `data:image/jpeg;base64,${avatar}` }} style={styles.avatarPreview} />
          ) : (
            <Text style={styles.avatarText}>Pick Profile Picture</Text>
          )}
        </TouchableOpacity>


        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={24} 
                color="#666"
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}
          >
            <Text style={styles.dateText}>
              {dateOfBirth ? formatDate(dateOfBirth) : 'Select Date of Birth'}
            </Text>
            <Ionicons name="calendar-outline" size={24} color="#666" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            multiline
            editable={!isLoading}
          />

          <TouchableOpacity 
            style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Sign up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginAccount}
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text style={styles.loginAccountText}>Already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F41BB',
    marginTop: 50,
  },
  subtitle: {
    fontSize: 20,
    color: '#000000',
    marginTop: 8,
    marginBottom: 30,
    lineHeight: 28,
  },
  form: {
    flex: 1,
  },
  input: {
    height: 50,
    backgroundColor: '#F1F4FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    height: 50,
    backgroundColor: '#F1F4FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  dateInput: {
    height: 50,
    backgroundColor: '#F1F4FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#000000',
  },
  signUpButton: {
    height: 50,
    backgroundColor: '#1F41BB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpButtonDisabled: {
    backgroundColor: '#B3B3B3',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginAccount: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  loginAccountText: {
    color: '#000000',
    fontSize: 14,
  },
  avatarPicker: {
    height: 120,
    width: 120,
    borderRadius: 60,
    backgroundColor: '#F1F4FF',
    alignSelf: 'center',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
  },
  
});

export default RegisterScreen; 