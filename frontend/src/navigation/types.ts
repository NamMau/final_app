import { Budget } from '../services/budgets.service';
import { Bill } from '../services/bills.service';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Category: undefined;
  Bills: { refresh?: boolean };
  BillScanner: undefined;
  BillDetails: { bill: Bill };
  CreateBill: undefined;
  UpdateBill: { bill: Bill };
  Profile: undefined;
  Budget: { refresh?: boolean };
  CreateBudget: undefined;
  UpdateBudget: { budget: Budget };
  Loan: undefined;
  CreateExpense: undefined;
  AddBill: undefined;
};