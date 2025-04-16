import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import BillScannerScreen from './src/screens/BillScannerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import LoanScreen from './src/screens/LoanScreen';
import CreateExpenseScreen from './src/screens/CreateExpenseScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="Welcome"
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="BillScanner" component={BillScannerScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Budget" component={BudgetScreen} />
        <Stack.Screen name="Loan" component={LoanScreen} />
        <Stack.Screen name="CreateExpense" component={CreateExpenseScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
