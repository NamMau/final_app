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
import CreateBudgetScreen from './src/screens/CreateBudgetScreen';
import UpdateBudgetScreen from './src/screens/UpdateBudgetScreen';
import CreateBillScreen from './src/screens/CreateBillScreen';
import AddBillScreen from './src/screens/AddBillScreen';
//import UpdateBillScreen from './src/screens/UpdateBillScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1F41BB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
        initialRouteName="Welcome"
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Category" component={CategoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateBill" component={CreateBillScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="AddBill" 
          component={AddBillScreen}
          options={{
            title: 'Add Bill'
          }}
        />
        <Stack.Screen name="BillScanner" component={BillScannerScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Budget" component={BudgetScreen} />
        <Stack.Screen name="CreateBudget" component={CreateBudgetScreen} />
        <Stack.Screen name="UpdateBudget" component={UpdateBudgetScreen} />
        <Stack.Screen name="Loan" component={LoanScreen} />
        <Stack.Screen name="CreateExpense" component={CreateExpenseScreen} />
        {/* <Stack.Screen name="UpdateBill" component={UpdateBillScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
