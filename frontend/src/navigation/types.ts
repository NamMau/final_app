import { Budget } from '../services/budgets.service';
import { Bill } from '../services/bills.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: { balanceUpdated?: boolean };
  BillScanner: undefined;
  AddBill: undefined;
  TransactionHistory: undefined;
  Budget: undefined;
  CreateBudget: undefined;
  UpdateBudget: { budgetId: string };
  Category: undefined;
  Loan: undefined;
  Profile: { balanceUpdated?: boolean };
  Bills: undefined;
};