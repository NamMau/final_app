import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { RootStackParamList } from './src/navigation/types';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddBillScreen from './src/screens/AddBillScreen';
import BillScannerScreen from './src/screens/BillScannerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import CreateBudgetScreen from './src/screens/CreateBudgetScreen';
import UpdateBudgetScreen from './src/screens/UpdateBudgetScreen';
import LoanScreen from './src/screens/LoanScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import FinancialReportScreen from './src/screens/FinancialReportScreen';
import GoalScreen from './src/screens/GoalScreen';
import GoalDetailScreen from './src/screens/GoalDetailScreen';
import CreateLoanScreen from './src/screens/CreateLoanScreen';
import LoanDetailScreen from './src/screens/LoanDetailScreen';
import RecordLoanPaymentScreen from './src/screens/RecordLoanPaymentScreen';
import UpdateGoalProgressScreen from './src/screens/UpdateGoalProgressScreen';
import CreateGoalScreen from './src/screens/CreateGoalScreen';

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
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ title: 'Transaction History' }} />
        <Stack.Screen 
          name="BillScanner" 
          component={BillScannerScreen} 
          options={{
            title: 'Scan Bill',
            headerShown: true
          }}
        />
        <Stack.Screen 
          name="AddBill" 
          component={AddBillScreen}
          options={{
            title: 'Add Bill',
            headerShown: true
          }}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Budget" component={BudgetScreen} />
        <Stack.Screen name="CreateBudget" component={CreateBudgetScreen} />
        <Stack.Screen name="UpdateBudget" component={UpdateBudgetScreen} />
        <Stack.Screen name="Loan" component={LoanScreen} />
        <Stack.Screen 
          name="FinancialReport" 
          component={FinancialReportScreen}
          options={{
            title: 'Financial Report',
            headerShown: false 
          }}
        />
        <Stack.Screen name="Goal" component={GoalScreen} />
        <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
        <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
        <Stack.Screen name="CreateLoan" component={CreateLoanScreen} />
        <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
        <Stack.Screen name="RecordLoanPayment" component={RecordLoanPaymentScreen} />
        <Stack.Screen name="UpdateGoalProgress" component={UpdateGoalProgressScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
