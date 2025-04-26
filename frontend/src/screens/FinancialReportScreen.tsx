import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { billsService } from '../services/bills.service';
import { budgetsService } from '../services/budgets.service';
import { transactionsService } from '../services/transactions.service';
import { financialReportsService, CategorySpending, BudgetStatus, MonthlyData, FinancialReport } from '../services/financialReports.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FinancialReportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FinancialReport'>;

const screenWidth = Dimensions.get('window').width;

// Extended CategorySpending for chart display
interface ChartCategorySpending extends CategorySpending {
  legendFontColor: string;
  legendFontSize: number;
}

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(31, 65, 187, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#ffa726',
  },
};

// Predefined colors for pie chart
const COLORS = [
  '#1F41BB', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
  '#9966FF', '#FF9F40', '#8AC926', '#FF595E', '#6A4C93'
];

const FinancialReportScreen = () => {
  const navigation = useNavigation<FinancialReportScreenNavigationProp>();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [chartCategorySpending, setChartCategorySpending] = useState<ChartCategorySpending[]>([]);
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    labels: [],
    income: [],
    expenses: []
  });
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [report, setReport] = useState<FinancialReport | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Load user balance
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setBalance(user.totalBalance || 0);
        }
      } catch (error) {
        console.error('Error loading balance:', error);
      }
    };
    
    loadBalance();
  }, []);

  // Load report data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Try to generate a report from the backend
        const generatedReport = await financialReportsService.generateFinancialReport(period);
        
        if (generatedReport) {
          setReport(generatedReport);
          setCategorySpending(generatedReport.categorySpending);
          setBudgetStatuses(generatedReport.budgetStatuses);
          setMonthlyData(generatedReport.monthlyData);
          setInsights(generatedReport.insights);
          setRecommendations(generatedReport.recommendations);
          
          // Convert category spending to chart format
          const chartData = generatedReport.categorySpending.map(category => ({
            ...category,
            legendFontColor: '#7F7F7F',
            legendFontSize: 12
          }));
          setChartCategorySpending(chartData);
        } else {
          // Fallback to local data if backend fails
          await Promise.all([
            loadCategorySpending(),
            loadBudgetStatuses(),
            loadMonthlyData(),
            generateInsights()
          ]);
        }
      } catch (error) {
        console.error('Error loading financial report data:', error);
        // Fallback to local data if backend fails
        await Promise.all([
          loadCategorySpending(),
          loadBudgetStatuses(),
          loadMonthlyData(),
          generateInsights()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  // Load category spending data for pie chart (fallback method)
  const loadCategorySpending = async () => {
    try {
      const bills = await billsService.getBills({ 
        status: 'paid'
      });

      // Group by category
      const categoryMap = new Map<string, number>();
      
      bills.forEach(bill => {
        if (bill.budget?.categoryID) {
          const categoryName = bill.budget.categoryID.categoryName;
          const currentAmount = categoryMap.get(categoryName) || 0;
          categoryMap.set(categoryName, currentAmount + bill.amount);
        }
      });

      // Convert to category spending data
      const categoryData: CategorySpending[] = Array.from(categoryMap.entries())
        .map(([name, amount], index) => ({
          name,
          amount,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 categories

      setCategorySpending(categoryData);
      
      // Convert to chart data
      const chartData: ChartCategorySpending[] = categoryData.map(category => ({
        ...category,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }));
      
      setChartCategorySpending(chartData);
    } catch (error) {
      console.error('Error loading category spending:', error);
    }
  };

  // Load budget statuses
  const loadBudgetStatuses = async () => {
    try {
      const budgets = await budgetsService.getBudgets();
      
      const statuses: BudgetStatus[] = budgets.map(budget => ({
        name: budget.name,
        spent: budget.spent,
        total: budget.amount,
        percentage: (budget.spent / budget.amount) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5); // Top 5 budgets by percentage spent
      
      setBudgetStatuses(statuses);
    } catch (error) {
      console.error('Error loading budget statuses:', error);
    }
  };

  // Load monthly income and expenses
  const loadMonthlyData = async () => {
    try {
      const stats = await transactionsService.getMonthlyStats(period);
      
      // Process data for line chart
      const labels: string[] = [];
      const income: number[] = [];
      const expenses: number[] = [];
      
      stats.forEach(stat => {
        // Format date as MM/DD
        const date = new Date(stat.date);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        labels.push(`${day}/${month}`);
        
        income.push(stat.income || 0);
        expenses.push(stat.expenses || 0);
      });
      
      setMonthlyData({
        labels,
        income,
        expenses
      });
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  // Generate insights based on actual financial data
  const generateInsights = async () => {
    try {
      // If we already have insights from the backend, use those
      if (report && report.insights && report.insights.length > 0 && 
          report.recommendations && report.recommendations.length > 0) {
        setInsights(report.insights);
        setRecommendations(report.recommendations);
        return;
      }
      
      // Make sure we have data before generating insights
      if (!categorySpending.length || !budgetStatuses.length || !monthlyData.labels.length) {
        console.log('Loading data before generating insights...');
        
        // Load data if not already loaded
        if (!categorySpending.length) {
          await loadCategorySpending();
        }
        
        if (!budgetStatuses.length) {
          await loadBudgetStatuses();
        }
        
        if (!monthlyData.labels.length) {
          await loadMonthlyData();
        }
        
        // If we still don't have data, use fallback
        if (!categorySpending.length && !budgetStatuses.length && !monthlyData.labels.length) {
          setInsights(["Not enough financial data to generate insights for this period."]);
          setRecommendations(["Start tracking your expenses to receive personalized recommendations."]);
          return;
        }
      }
      
      console.log('Generating insights with data:', {
        categorySpendingCount: categorySpending.length,
        budgetStatusesCount: budgetStatuses.length,
        monthlyDataPointsCount: monthlyData.labels.length,
        period,
        balance
      });
      
      // Generate static insights based on the data we have
      // This will ensure we always have meaningful insights even if the backend call fails
      const staticInsights = [];
      const staticRecommendations = [];
      
      // Add insights based on category spending
      if (categorySpending.length > 0) {
        const sortedCategories = [...categorySpending].sort((a, b) => b.amount - a.amount);
        const topCategory = sortedCategories[0];
        const totalSpent = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
        
        if (topCategory && totalSpent > 0) {
          const percentage = Math.round((topCategory.amount / totalSpent) * 100);
          staticInsights.push(`${topCategory.name} is your top spending category at ${percentage}% of total expenses.`);
          
          if (percentage > 40) {
            staticRecommendations.push(`Consider reducing spending in ${topCategory.name} category as it represents ${percentage}% of your total expenses.`);
          }
        }
      }
      
      // Add insights based on budget statuses
      if (budgetStatuses.length > 0) {
        const overBudgets = budgetStatuses.filter(budget => budget.percentage >= 90);
        const nearBudgets = budgetStatuses.filter(budget => budget.percentage >= 70 && budget.percentage < 90);
        
        if (overBudgets.length > 0) {
          staticInsights.push(`You have ${overBudgets.length} budget${overBudgets.length > 1 ? 's' : ''} that ${overBudgets.length > 1 ? 'are' : 'is'} over 90% spent.`);
          
          overBudgets.forEach(budget => {
            staticRecommendations.push(`Increase your '${budget.name}' budget or reduce spending as it's currently at ${Math.round(budget.percentage)}% of limit.`);
          });
        }
        
        if (nearBudgets.length > 0) {
          staticInsights.push(`${nearBudgets.length} budget${nearBudgets.length > 1 ? 's are' : ' is'} approaching the limit (70-90% spent).`);
        }
      }
      
      // Add insights based on monthly data
      if (monthlyData.labels.length > 0 && monthlyData.expenses.length > 0) {
        const totalExpenses = monthlyData.expenses.reduce((sum, exp) => sum + exp, 0);
        if (totalExpenses > 0) {
          staticInsights.push(`Your total expenses for this ${period} are ${formatCurrency(totalExpenses)}.`);
        }
        
        // Check spending trends
        if (monthlyData.expenses.length > 2) {
          const lastExpense = monthlyData.expenses[monthlyData.expenses.length - 1];
          const secondLastExpense = monthlyData.expenses[monthlyData.expenses.length - 2];
          
          if (lastExpense > 0 && secondLastExpense > 0 && lastExpense > secondLastExpense) {
            const increasePercentage = ((lastExpense - secondLastExpense) / secondLastExpense) * 100;
            if (increasePercentage > 20) {
              staticInsights.push(`Your spending increased by ${Math.round(increasePercentage)}% compared to the previous period.`);
              staticRecommendations.push(`Review your recent expenses as they've increased significantly.`);
            }
          }
        }
      }
      
      // Ensure we have at least some insights and recommendations
      if (staticInsights.length === 0) {
        staticInsights.push(`Continue tracking your finances to receive more detailed insights.`);
      }
      
      if (staticRecommendations.length === 0) {
        staticRecommendations.push(`Set up budget categories to better monitor your spending patterns.`);
      }
      
      // Try to get insights from the backend
      try {
        const response = await financialReportsService.generateInsights({
          period,
          categorySpending,
          budgetStatuses,
          monthlyData,
          balance
        });
        
        console.log('Received insights response:', JSON.stringify(response));
        
        if (response && response.success && response.data) {
          console.log('Setting insights from response:', response.data.insights);
          console.log('Setting recommendations from response:', response.data.recommendations);
          
          if (Array.isArray(response.data.insights) && response.data.insights.length > 0) {
            setInsights(response.data.insights);
          } else {
            setInsights(staticInsights);
          }
          
          if (Array.isArray(response.data.recommendations) && response.data.recommendations.length > 0) {
            setRecommendations(response.data.recommendations);
          } else {
            setRecommendations(staticRecommendations);
          }
        } else {
          // Use our static insights if the backend call fails
          setInsights(staticInsights);
          setRecommendations(staticRecommendations);
        }
      } catch (error) {
        console.error('Error fetching insights from backend:', error);
        // Use our static insights if the backend call fails
        setInsights(staticInsights);
        setRecommendations(staticRecommendations);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      
      // Fallback to basic insights if there's an error
      setInsights(["Error generating financial insights."]);
      setRecommendations(["Please try again later or contact support if the problem persists."]);
    }
  };

  // Save the current report to the database
  const saveReport = async () => {
    try {
      setSaving(true);
      
      // If we already have a report from the backend, no need to save it again
      if (report && report._id) {
        Alert.alert('Success', 'Report already saved');
        setSaving(false);
        return;
      }
      
      // Calculate total expenses from category spending
      const totalExpenses = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
      
      // Calculate savings rate
      const savingsRate = balance > 0 ? ((balance - totalExpenses) / balance) * 100 : 0;
      
      // Format category spending to ensure it matches the backend model
      const formattedCategorySpending = categorySpending.map(category => ({
        name: category.name,
        amount: category.amount,
        color: category.color
      }));
      
      // Format budget statuses to ensure it matches the backend model
      const formattedBudgetStatuses = budgetStatuses.map(budget => ({
        name: budget.name,
        spent: budget.spent,
        total: budget.total,
        percentage: budget.percentage
      }));
      
      // Create report data with properly formatted fields
      const reportData = {
        period,
        categorySpending: formattedCategorySpending,
        budgetStatuses: formattedBudgetStatuses,
        monthlyData: {
          labels: monthlyData.labels,
          income: monthlyData.income,
          expenses: monthlyData.expenses
        },
        insights,
        recommendations,
        totalIncome: balance,
        totalExpenses,
        savingsRate
      };
      
      console.log('Saving financial report with data:', JSON.stringify(reportData));
      
      const savedReport = await financialReportsService.saveFinancialReport(reportData);
      
      if (savedReport) {
        setReport(savedReport);
        Alert.alert('Success', 'Financial report saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save financial report');
      }
    } catch (error) {
      console.error('Error saving financial report:', error);
      Alert.alert('Error', 'Failed to save financial report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1F41BB" />
        <Text style={styles.loadingText}>Analyzing financial data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F41BB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Report</Text>
        <TouchableOpacity onPress={saveReport} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#1F41BB" />
          ) : (
            <Ionicons name="save-outline" size={24} color="#1F41BB" />
          )}
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={[styles.periodButton, period === 'week' && styles.activePeriod]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodText, period === 'week' && styles.activePeriodText]}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.periodButton, period === 'month' && styles.activePeriod]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodText, period === 'month' && styles.activePeriodText]}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.periodButton, period === 'year' && styles.activePeriod]}
          onPress={() => setPeriod('year')}
        >
          <Text style={[styles.periodText, period === 'year' && styles.activePeriodText]}>Year</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Spending by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <View style={styles.chartContainer}>
            {chartCategorySpending.length > 0 ? (
              <PieChart
                data={chartCategorySpending}
                width={screenWidth - 40}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <Text style={styles.noDataText}>No spending data available</Text>
            )}
          </View>
        </View>

        {/* Budget Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Status</Text>
          {budgetStatuses.length > 0 ? (
            budgetStatuses.map((budget, index) => (
              <View key={index} style={styles.budgetItem}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetName}>{budget.name}</Text>
                  <Text style={styles.budgetPercentage}>{budget.percentage.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${Math.min(budget.percentage, 100)}%` },
                      budget.percentage > 90 ? styles.dangerProgress : 
                      budget.percentage > 70 ? styles.warningProgress : 
                      styles.goodProgress
                    ]} 
                  />
                </View>
                <View style={styles.budgetDetails}>
                  <Text style={styles.budgetSpent}>{formatCurrency(budget.spent)}</Text>
                  <Text style={styles.budgetTotal}>/ {formatCurrency(budget.total)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No budget data available</Text>
          )}
        </View>

        {/* Income vs Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income & Expenses</Text>
          <View style={styles.chartContainer}>
            {monthlyData.labels.length > 0 ? (
              <LineChart
                data={{
                  labels: monthlyData.labels,
                  datasets: [
                    {
                      data: monthlyData.income,
                      color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
                      strokeWidth: 2
                    },
                    {
                      data: monthlyData.expenses,
                      color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                      strokeWidth: 2
                    }
                  ],
                  legend: ["Income", "Expenses"]
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                bezier
                style={styles.lineChart}
              />
            ) : (
              <Text style={styles.noDataText}>No income and expense data available</Text>
            )}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Insights</Text>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Ionicons name="analytics-outline" size={20} color="#1F41BB" />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Recommendations</Text>
          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="bulb-outline" size={20} color="#FF9500" />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1F41BB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F41BB',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  activePeriod: {
    backgroundColor: '#1F41BB',
  },
  periodText: {
    fontSize: 14,
    color: '#666666',
  },
  activePeriodText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginVertical: 20,
  },
  budgetItem: {
    marginBottom: 15,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  budgetName: {
    fontSize: 14,
    color: '#333333',
  },
  budgetPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#EEEEEE',
    borderRadius: 5,
    marginBottom: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  goodProgress: {
    backgroundColor: '#2ECC71',
  },
  warningProgress: {
    backgroundColor: '#F39C12',
  },
  dangerProgress: {
    backgroundColor: '#E74C3C',
  },
  budgetDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetSpent: {
    fontSize: 12,
    color: '#333333',
  },
  budgetTotal: {
    fontSize: 12,
    color: '#999999',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  insightText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
    flex: 1,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
    flex: 1,
  },
});

export default FinancialReportScreen;
