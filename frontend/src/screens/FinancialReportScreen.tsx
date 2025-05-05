import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Alert, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { billsService } from '../services/bills.service';
import { budgetsService } from '../services/budgets.service';
import { transactionsService, Transaction } from '../services/transactions.service';
import { financialReportsService, CategorySpending, BudgetStatus, MonthlyData, FinancialReport, BudgetComparison } from '../services/financialReports.service';
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
  const [budgetComparisons, setBudgetComparisons] = useState<BudgetComparison[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    labels: [],
    income: [],
    expenses: []
  });
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [unusualSpending, setUnusualSpending] = useState<{category: string; amount: number; percentageAboveAverage: number; date: string; frequency?: string; seasonalContext?: string}[]>([]);
  const [showUnusualSpending, setShowUnusualSpending] = useState<boolean>(false);
  const [detectingUnusualSpending, setDetectingUnusualSpending] = useState<boolean>(false);
  const [customThreshold, setCustomThreshold] = useState<number>(150); // Default 150% threshold

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
          
          // Set budget comparisons if available
          if (generatedReport.budgetComparisons && generatedReport.budgetComparisons.length > 0) {
            setBudgetComparisons(generatedReport.budgetComparisons);
          } else {
            // Generate budget comparisons locally if not provided by backend
            generateBudgetComparisons(generatedReport.categorySpending, generatedReport.budgetStatuses);
          }
          
          // Convert category spending to chart format
          const chartData = generatedReport.categorySpending.map(category => ({
            ...category,
            legendFontColor: '#7F7F7F',
            legendFontSize: 12
          }));
          setChartCategorySpending(chartData);
        } else {
          // Fallback to local data if backend fails
          const [categories, budgets] = await Promise.all([
            loadCategorySpending(),
            loadBudgetStatuses(),
            loadMonthlyData(),
            generateInsights()
          ]);
          
          // Generate budget comparisons from local data
          if (categories && budgets) {
            generateBudgetComparisons(categories, budgets);
          }
        }
      } catch (error) {
        console.error('Error loading financial report data:', error);
        // Fallback to local data if backend fails
        const [categories, budgets] = await Promise.all([
          loadCategorySpending(),
          loadBudgetStatuses(),
          loadMonthlyData(),
          generateInsights()
        ]);
        
        // Generate budget comparisons from local data
        if (categories && budgets) {
          generateBudgetComparisons(categories, budgets);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  // Load category spending data for pie chart (fallback method)
  const loadCategorySpending = async (): Promise<CategorySpending[]> => {
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
      return categoryData;
    } catch (error) {
      console.error('Error loading category spending:', error);
      return [];
    }
  };

  // Generate budget comparisons locally
  const generateBudgetComparisons = (categories: CategorySpending[], budgets: BudgetStatus[]) => {
    try {
      // Create a map of category spending
      const categorySpendingMap = new Map<string, number>();
      categories.forEach(category => {
        categorySpendingMap.set(category.name, category.amount);
      });
      
      // Create budget comparisons
      const comparisons: BudgetComparison[] = budgets.map((budget, index) => {
        const categoryName = budget.name;
        const budgetAmount = budget.total;
        const actualSpent = budget.spent;
        const difference = budgetAmount - actualSpent;
        const percentageOfBudget = (actualSpent / budgetAmount) * 100;
        
        return {
          categoryName,
          budgetAmount,
          actualSpent,
          difference,
          percentageOfBudget,
          color: COLORS[index % COLORS.length]
        };
      });
      
      setBudgetComparisons(comparisons);
    } catch (error) {
      console.error('Error generating budget comparisons:', error);
    }
  };
  
  // Load budget statuses
  const loadBudgetStatuses = async (): Promise<BudgetStatus[]> => {
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
      return statuses;
    } catch (error) {
      console.error('Error loading budget statuses:', error);
      return [];
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
          budgetComparisons,
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

  // Detect unusual spending patterns
  const detectUnusualSpending = useCallback(async () => {
    try {
      setDetectingUnusualSpending(true);
      
      // Get the date range for analysis (last 6 months)
      const today = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Call the backend service to detect unusual spending
      const response = await financialReportsService.detectUnusualSpending({
        startDate,
        endDate,
        threshold: customThreshold,
        includeSeasonalContext: true
      });
      
      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to detect unusual spending patterns');
        return;
      }
      
      if (response.data.unusualTransactions.length === 0) {
        Alert.alert('No Unusual Spending', 'No unusual spending patterns were detected with the current threshold.');
        return;
      }
      
      setUnusualSpending(response.data.unusualTransactions);
      setShowUnusualSpending(true);
    } catch (error) {
      console.error('Error detecting unusual spending:', error);
      Alert.alert('Error', 'Failed to detect unusual spending patterns');
    } finally {
      setDetectingUnusualSpending(false);
    }
  }, [customThreshold]);
  
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
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={detectUnusualSpending} 
            style={[styles.actionButton, styles.detectButton]}
            disabled={detectingUnusualSpending}
          >
            <Text style={styles.actionButtonText}>
              {detectingUnusualSpending ? 'Detecting...' : 'Detect Unusual'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={saveReport} disabled={saving} style={[styles.actionButton, styles.saveButton]}>
            <Text style={styles.actionButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
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

      {/* Unusual Spending Modal */}
      <Modal
        visible={showUnusualSpending}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUnusualSpending(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Unusual Spending Detected</Text>
              <TouchableOpacity onPress={() => setShowUnusualSpending(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.thresholdContainer}>
              <Text style={styles.thresholdLabel}>Sensitivity: {customThreshold}%</Text>
              <View style={styles.thresholdSliderContainer}>
                <Text style={styles.thresholdMin}>Low</Text>
                <Slider
                  style={styles.thresholdSlider}
                  minimumValue={120}
                  maximumValue={200}
                  step={5}
                  value={customThreshold}
                  onValueChange={(value: number) => setCustomThreshold(value)}
                  onSlidingComplete={() => detectUnusualSpending()}
                  minimumTrackTintColor="#9c27b0"
                  maximumTrackTintColor="#d3d3d3"
                  thumbTintColor="#9c27b0"
                />
                <Text style={styles.thresholdMax}>High</Text>
              </View>
              <Text style={styles.thresholdHint}>
                Transactions above {customThreshold}% of category average are considered unusual
              </Text>
              <Text style={styles.thresholdNote}>
                Move slider and release to re-analyze with new threshold
              </Text>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {unusualSpending.length > 0 ? (
                unusualSpending.map((item, index) => (
                  <View key={index} style={styles.unusualItem}>
                    <View style={styles.unusualItemHeader}>
                      <Text style={styles.unusualCategory}>{item.category}</Text>
                      <Text style={styles.unusualPercentage}>
                        +{Math.round(item.percentageAboveAverage)}% above average
                      </Text>
                    </View>
                    <View style={styles.unusualItemDetails}>
                      <Text style={styles.unusualAmount}>{formatCurrency(item.amount)}</Text>
                      <Text style={styles.unusualDate}>
                        {new Date(item.date).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    {item.seasonalContext && (
                      <View style={styles.contextContainer}>
                        <Text style={styles.contextLabel}>
                          <Ionicons name="calendar-outline" size={14} color="#666" /> {item.seasonalContext}
                        </Text>
                      </View>
                    )}
                    {item.frequency && (
                      <View style={styles.contextContainer}>
                        <Text style={styles.contextLabel}>
                          <Ionicons name="repeat-outline" size={14} color="#666" /> {item.frequency}
                        </Text>
                      </View>
                    )}
                    <View style={styles.unusualItemBar}>
                      <View 
                        style={[styles.unusualItemBarFill, 
                          { width: `${Math.min(item.percentageAboveAverage, 300)}%` }
                        ]} 
                      />
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noUnusualContainer}>
                  <Text style={styles.noUnusualText}>No unusual spending patterns detected</Text>
                  <Text style={styles.noUnusualSubtext}>
                    Your spending appears to be consistent with your historical patterns
                  </Text>
                </View>
              )}
            </ScrollView>
            
            {unusualSpending.length > 0 && (
              <View style={styles.unusualSummary}>
                <Text style={styles.unusualSummaryText}>
                  {unusualSpending.length} unusual transaction{unusualSpending.length !== 1 ? 's' : ''} detected
                </Text>
                <Text style={styles.unusualSummarySubtext}>
                  These transactions are significantly higher than your typical spending in these categories
                </Text>
                
                {/* Generate insights about unusual spending */}
                {unusualSpending.length > 0 && (
                  <View style={styles.insightsContainer}>
                    <Text style={styles.insightsTitle}>Insights:</Text>
                    <View style={styles.insightsList}>
                      {/* Most affected category */}
                      {(() => {
                        // Group by category and find the one with most unusual transactions
                        const categoryCount = new Map<string, number>();
                        unusualSpending.forEach(item => {
                          categoryCount.set(item.category, (categoryCount.get(item.category) || 0) + 1);
                        });
                        
                        const mostAffectedCategory = Array.from(categoryCount.entries())
                          .sort((a, b) => b[1] - a[1])[0];
                          
                        if (mostAffectedCategory) {
                          return (
                            <Text style={styles.unusualInsightItem}>
                              <Ionicons name="alert-circle" size={14} color="#e74c3c" /> 
                              {mostAffectedCategory[0]} has the most unusual transactions ({mostAffectedCategory[1]})
                            </Text>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Seasonal patterns */}
                      {(() => {
                        const seasonalItems = unusualSpending.filter(item => item.seasonalContext);
                        if (seasonalItems.length > 0) {
                          return (
                            <Text style={styles.unusualInsightItem}>
                              <Ionicons name="calendar" size={14} color="#3498db" /> 
                              {seasonalItems.length} unusual transaction{seasonalItems.length !== 1 ? 's' : ''} occurred during seasonal periods
                            </Text>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Highest deviation */}
                      {(() => {
                        const highestDeviation = unusualSpending.reduce(
                          (max, item) => item.percentageAboveAverage > max.percentageAboveAverage ? item : max, 
                          unusualSpending[0]
                        );
                        
                        return (
                          <Text style={styles.unusualInsightItem}>
                            <Ionicons name="trending-up" size={14} color="#e67e22" /> 
                            Highest deviation: {highestDeviation.category} at +{Math.round(highestDeviation.percentageAboveAverage)}% above average
                          </Text>
                        );
                      })()}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
      
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
        
        {/* Budget vs Actual Spending */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget vs Actual Spending</Text>
          {budgetComparisons.length > 0 ? (
            budgetComparisons.map((comparison, index) => (
              <View key={index} style={styles.comparisonItem}>
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonName}>{comparison.categoryName}</Text>
                  <Text 
                    style={[styles.comparisonPercentage, 
                      comparison.percentageOfBudget > 100 ? styles.overBudgetText : 
                      comparison.percentageOfBudget > 90 ? styles.nearBudgetText : 
                      styles.underBudgetText
                    ]}
                  >
                    {comparison.percentageOfBudget.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.comparisonDetails}>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Budget:</Text>
                    <Text style={styles.comparisonValue}>{formatCurrency(comparison.budgetAmount)}</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Actual:</Text>
                    <Text style={styles.comparisonValue}>{formatCurrency(comparison.actualSpent)}</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonLabel}>Difference:</Text>
                    <Text 
                      style={[styles.comparisonValue, 
                        comparison.difference < 0 ? styles.negativeAmount : styles.positiveAmount
                      ]}
                    >
                      {comparison.difference < 0 ? '-' : '+'}{formatCurrency(Math.abs(comparison.difference))}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${Math.min(comparison.percentageOfBudget, 100)}%` },
                      comparison.percentageOfBudget > 100 ? styles.overBudgetBar : 
                      comparison.percentageOfBudget > 90 ? styles.nearBudgetBar : 
                      styles.underBudgetBar
                    ]} 
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No budget comparison data available</Text>
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
  // Unusual spending detection styles
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1F41BB',
  },
  detectButton: {
    backgroundColor: '#9c27b0',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalScrollView: {
    maxHeight: 350,
  },
  thresholdContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  thresholdLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  thresholdSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  thresholdSlider: {
    flex: 1,
    height: 40,
  },
  thresholdMin: {
    width: 30,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  thresholdMax: {
    width: 30,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  thresholdHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  thresholdNote: {
    fontSize: 11,
    color: '#9c27b0',
    marginTop: 5,
    textAlign: 'center',
  },
  unusualItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unusualItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unusualCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unusualPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  unusualItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  unusualAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  unusualDate: {
    fontSize: 14,
    color: '#666',
  },
  contextContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  unusualItemBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  unusualItemBarFill: {
    height: '100%',
    backgroundColor: '#e74c3c',
  },
  noUnusualContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noUnusualText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 8,
  },
  noUnusualSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  unusualSummary: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  unusualSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unusualSummarySubtext: {
    fontSize: 14,
    color: '#666',
  },
  insightsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  insightsList: {
    marginLeft: 5,
  },
  unusualInsightItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    lineHeight: 20,
  },
  
  // Budget comparison styles
  comparisonItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  comparisonPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  comparisonDetails: {
    marginBottom: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  overBudgetText: {
    color: '#e74c3c',
  },
  nearBudgetText: {
    color: '#f39c12',
  },
  underBudgetText: {
    color: '#27ae60',
  },
  positiveAmount: {
    color: '#27ae60',
  },
  negativeAmount: {
    color: '#e74c3c',
  },
  overBudgetBar: {
    backgroundColor: '#e74c3c',
  },
  nearBudgetBar: {
    backgroundColor: '#f39c12',
  },
  underBudgetBar: {
    backgroundColor: '#27ae60',
  },
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
