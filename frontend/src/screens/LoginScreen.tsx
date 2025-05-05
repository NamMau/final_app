import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { authService, LoginResponse } from '../services/auth.service'; // Import authService và LoginResponse
import { ENDPOINTS } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SuccessModal from '../components/SuccessModal';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting login with:', { email });
      const response = await authService.login(email, password);
      console.log('Login successful:', response);

      // Đảm bảo dữ liệu người dùng đã được lưu trữ đúng cách
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const user = await AsyncStorage.getItem('user');
        
        if (!token || !user) {
          console.error('Login successful but token or user data not stored properly');
          throw new Error('Authentication data not stored properly');
        }
        
        // Kiểm tra xem dữ liệu người dùng có hợp lệ không
        try {
          JSON.parse(user);
        } catch (parseError) {
          console.error('User data is not valid JSON:', parseError);
          // Không ném lỗi ở đây, vẫn tiếp tục với dữ liệu hiện có
        }
        
        // Show success modal
        setShowSuccessModal(true);

        // Navigate after a short delay
        setTimeout(() => {
          setShowSuccessModal(false);
          try {
            // Sử dụng navigate thay vì reset để tránh các vấn đề với navigation stack
            navigation.navigate('Dashboard' as never);
          } catch (navError) {
            console.error('Navigation failed:', navError);
            // Thử lại với cách khác nếu cách đầu tiên thất bại
            try {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              });
            } catch (resetError) {
              console.error('Navigation reset also failed:', resetError);
              Alert.alert(
                'Navigation Error',
                'Could not navigate to Dashboard. Please restart the app.',
                [{ text: 'OK' }]
              );
            }
          }
        }, 2000);
      } catch (storageError) {
        console.error('Error verifying stored auth data:', storageError);
        Alert.alert(
          'Login Issue',
          'Login was successful, but there was an issue storing your session. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
      Alert.alert(
        'Login Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Login here</Text>
        <Text style={styles.subtitle}>Welcome back you've{'\n'}been missed!</Text>

        <View style={styles.form}>
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
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signInButtonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createAccount}
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading}
          >
            <Text style={styles.createAccountText}>Create new account</Text>
          </TouchableOpacity>

          {/* Tạm thời ẩn phần social login vì chưa implement
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>Or continue with</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              disabled={isLoading}
            >
              <Ionicons name="logo-facebook" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              disabled={isLoading}
            >
              <Ionicons name="logo-apple" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          */}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F41BB',
    marginTop: 20,
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
  signInButton: {
    height: 50,
    backgroundColor: '#1F41BB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signInButtonDisabled: {
    backgroundColor: '#B3B3B3',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createAccount: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  createAccountText: {
    color: '#000000',
    fontSize: 14,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  orText: {
    color: '#666666',
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F1F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;