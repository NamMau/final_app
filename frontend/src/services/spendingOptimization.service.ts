import { apiService } from './api';
import { ENDPOINTS } from '../config/constants';
import { transactionsService, Transaction } from './transactions.service';
import { billsService } from './bills.service';

// API response interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface SpendingRecommendation {
  id: string;
  type: 'cut_spending' | 'reallocate_budget' | 'habit_change' | 'time_optimization' | 'service_replacement';
  title: string;
  description: string;
  potentialSavings: number;
  category?: string;
  relevanceScore: number; // 0-100 score indicating how relevant this recommendation is
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  icon: string; // Ionicons name
  color: string;
}

export const spendingOptimizationService = {
  /**
   * Generate spending optimization recommendations based on transaction history
   * @returns List of spending recommendations
   */
  async getRecommendations(): Promise<SpendingRecommendation[]> {
    try {
      // Call the backend API to get spending optimization recommendations
      const response = await apiService.get<ApiResponse<SpendingRecommendation[]>>(
        `${ENDPOINTS.FINANCIAL_REPORTS.SPENDING_OPTIMIZATION}`
      );
      
      if (!response || !response.success || !response.data) {
        console.error('Error getting spending recommendations:', response?.message || 'Unknown error');
        return [];
      }
      
      // Ensure we return the array of recommendations from the response data
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error generating spending recommendations:', error);
      
      // Fallback to local generation if the API fails
      try {
        // Get transactions from the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const transactions = await transactionsService.getTransactions({
          startDate: sixMonthsAgo.toISOString(),
          endDate: new Date().toISOString()
        });
        
        // Get bills from the last 6 months
        const bills = await billsService.getBills({
          startDate: sixMonthsAgo.toISOString(),
          endDate: new Date().toISOString()
        });
        
        // Generate recommendations based on the data
        return this.analyzeSpendingPatterns(transactions, bills);
      } catch (fallbackError) {
        console.error('Fallback recommendation generation failed:', fallbackError);
        return [];
      }
    }
  },
  
  /**
   * Analyze spending patterns to generate recommendations
   * @param transactions User's transaction history
   * @param bills User's bills
   * @returns List of spending recommendations
   */
  analyzeSpendingPatterns(transactions: Transaction[], bills: any[]): SpendingRecommendation[] {
    const recommendations: SpendingRecommendation[] = [];
    
    if (transactions.length === 0) {
      return recommendations;
    }
    
    // Group transactions by category
    const categorySpending = this.groupTransactionsByCategory(transactions);
    
    // Find categories with highest spending
    const topCategories = this.findTopSpendingCategories(categorySpending);
    
    // Analyze spending patterns by day of week
    const dayOfWeekPatterns = this.analyzeDayOfWeekPatterns(transactions);
    
    // Check for recurring subscription payments
    const subscriptions = this.identifySubscriptions(transactions);
    
    // Generate recommendations based on the analysis
    
    // 1. Recommendations for top spending categories
    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      
      recommendations.push({
        id: 'top-category-' + Date.now(),
        type: 'reallocate_budget',
        title: `Optimize your ${topCategory.category} spending`,
        description: `You're spending ${Math.round(topCategory.percentage)}% of your budget on ${topCategory.category}. Consider reducing this to ${Math.round(topCategory.percentage * 0.7)}% to save approximately ${this.formatCurrency(topCategory.total * 0.3)} per month.`,
        potentialSavings: topCategory.total * 0.3,
        category: topCategory.category,
        relevanceScore: 90,
        implementationDifficulty: 'medium',
        icon: 'pie-chart',
        color: '#4CAF50'
      });
    }
    
    // 2. Recommendations for day of week patterns
    const highestDayPattern = this.findHighestSpendingDay(dayOfWeekPatterns);
    if (highestDayPattern) {
      recommendations.push({
        id: 'day-pattern-' + Date.now(),
        type: 'habit_change',
        title: `Reduce ${highestDayPattern.day} spending`,
        description: `You tend to spend ${this.formatCurrency(highestDayPattern.averageSpending)} on ${highestDayPattern.day}s, which is ${Math.round(highestDayPattern.percentageHigher)}% higher than your daily average. Planning ahead could save you approximately ${this.formatCurrency(highestDayPattern.potentialSavings)} per month.`,
        potentialSavings: highestDayPattern.potentialSavings,
        relevanceScore: 85,
        implementationDifficulty: 'easy',
        icon: 'calendar',
        color: '#FF9800'
      });
    }
    
    // 3. Recommendations for subscriptions
    if (subscriptions.length > 2) {
      const totalSubscriptionCost = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
      
      recommendations.push({
        id: 'subscription-' + Date.now(),
        type: 'cut_spending',
        title: 'Streamline your subscriptions',
        description: `You're spending ${this.formatCurrency(totalSubscriptionCost)} monthly on ${subscriptions.length} subscription services. Consider consolidating or eliminating less-used services to save up to ${this.formatCurrency(totalSubscriptionCost * 0.4)} per month.`,
        potentialSavings: totalSubscriptionCost * 0.4,
        relevanceScore: 80,
        implementationDifficulty: 'easy',
        icon: 'repeat',
        color: '#E91E63'
      });
    }
    
    // 4. Recommendation for food spending if it's high
    const foodCategory = categorySpending.find(c => 
      c.category.toLowerCase().includes('food') || 
      c.category.toLowerCase().includes('restaurant') ||
      c.category.toLowerCase().includes('dining')
    );
    
    if (foodCategory && foodCategory.percentage > 25) {
      recommendations.push({
        id: 'food-' + Date.now(),
        type: 'habit_change',
        title: 'Optimize food expenses',
        description: `You spend ${this.formatCurrency(foodCategory.total)} (${Math.round(foodCategory.percentage)}% of total) on food and dining. Meal prepping on weekends could reduce this by 20%, saving approximately ${this.formatCurrency(foodCategory.total * 0.2)} monthly.`,
        potentialSavings: foodCategory.total * 0.2,
        category: foodCategory.category,
        relevanceScore: 75,
        implementationDifficulty: 'medium',
        icon: 'restaurant',
        color: '#3F51B5'
      });
    }
    
    // 5. Time optimization recommendation
    recommendations.push({
      id: 'time-opt-' + Date.now(),
      type: 'time_optimization',
      title: 'Shop during discount days',
      description: 'Shopping for groceries and household items on Wednesday (discount day at most supermarkets) could save you 10-15% on these expenses.',
      potentialSavings: this.estimateSavingsForCategory(categorySpending, 'Groceries', 0.12),
      relevanceScore: 70,
      implementationDifficulty: 'easy',
      icon: 'time',
      color: '#00BCD4'
    });
    
    // Sort recommendations by relevance score (highest first)
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  },
  
  /**
   * Group transactions by category and calculate totals
   */
  groupTransactionsByCategory(transactions: Transaction[]) {
    const categories: {[key: string]: number} = {};
    let total = 0;
    
    transactions.forEach(transaction => {
      const categoryName = transaction.category?.categoryName || 'Uncategorized';
      if (!categories[categoryName]) {
        categories[categoryName] = 0;
      }
      categories[categoryName] += transaction.amount;
      total += transaction.amount;
    });
    
    // Convert to array with percentages
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      total: amount,
      percentage: (amount / total) * 100
    }));
  },
  
  /**
   * Find top spending categories
   */
  findTopSpendingCategories(categorySpending: {category: string, total: number, percentage: number}[]) {
    return [...categorySpending]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  },
  
  /**
   * Analyze spending patterns by day of week
   */
  analyzeDayOfWeekPatterns(transactions: Transaction[]) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayTotals: {[key: string]: {count: number, total: number}} = {};
    
    // Initialize all days
    days.forEach(day => {
      dayTotals[day] = { count: 0, total: 0 };
    });
    
    // Sum up spending by day of week
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const day = days[date.getDay()];
      dayTotals[day].count += 1;
      dayTotals[day].total += transaction.amount;
    });
    
    // Calculate average spending per day
    const dayAverages = days.map(day => ({
      day,
      totalSpending: dayTotals[day].total,
      count: dayTotals[day].count,
      averageSpending: dayTotals[day].count > 0 ? dayTotals[day].total / dayTotals[day].count : 0
    }));
    
    // Calculate overall daily average
    const totalSpending = Object.values(dayTotals).reduce((sum, day) => sum + day.total, 0);
    const totalDays = Object.values(dayTotals).reduce((sum, day) => sum + day.count, 0);
    const overallDailyAverage = totalDays > 0 ? totalSpending / totalDays : 0;
    
    // Calculate percentage higher than average
    return dayAverages.map(day => ({
      ...day,
      percentageHigher: overallDailyAverage > 0 
        ? ((day.averageSpending - overallDailyAverage) / overallDailyAverage) * 100 
        : 0,
      potentialSavings: Math.max(0, (day.averageSpending - overallDailyAverage) * 4) // Assume 4 occurrences per month
    }));
  },
  
  /**
   * Find the day with highest average spending
   */
  findHighestSpendingDay(dayPatterns: any[]) {
    if (dayPatterns.length === 0) return null;
    
    const highestDay = dayPatterns
      .filter(day => day.count >= 3) // Only consider days with enough data
      .sort((a, b) => b.percentageHigher - a.percentageHigher)[0];
    
    return highestDay && highestDay.percentageHigher > 20 ? highestDay : null;
  },
  
  /**
   * Identify potential subscription payments
   */
  identifySubscriptions(transactions: Transaction[]) {
    // Group transactions by description and amount
    const groups: {[key: string]: Transaction[]} = {};
    
    transactions.forEach(transaction => {
      const key = `${transaction.description}-${transaction.amount}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    });
    
    // Find groups that appear monthly (potential subscriptions)
    return Object.values(groups)
      .filter(group => {
        if (group.length < 2) return false;
        
        // Check if transactions occur at regular intervals
        const dates = group.map(t => new Date(t.date).getTime()).sort();
        const intervals = [];
        
        for (let i = 1; i < dates.length; i++) {
          intervals.push(dates[i] - dates[i-1]);
        }
        
        // Check if intervals are roughly monthly (25-35 days)
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const monthInMs = 30 * 24 * 60 * 60 * 1000;
        
        return Math.abs(avgInterval - monthInMs) < (5 * 24 * 60 * 60 * 1000); // Within 5 days of a month
      })
      .map(group => ({
        description: group[0].description,
        amount: group[0].amount,
        category: group[0].category?.categoryName,
        count: group.length
      }));
  },
  
  /**
   * Estimate potential savings for a category
   */
  estimateSavingsForCategory(categorySpending: {category: string, total: number, percentage: number}[], categoryName: string, savingsRate: number) {
    const category = categorySpending.find(c => 
      c.category.toLowerCase().includes(categoryName.toLowerCase())
    );
    
    if (!category) return 100000; // Default value if category not found
    
    return category.total * savingsRate;
  },
  
  /**
   * Format currency for display
   */
  formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
};

export default spendingOptimizationService;
