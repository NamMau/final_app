import { Budget } from '../services/budgets.service';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Category: undefined;
  BillScanner: undefined;
  Profile: undefined;
  Budget: undefined;
  CreateBudget: undefined;
  UpdateBudget: { budget: Budget };
  Loan: undefined;
  CreateExpense: undefined;
}; 