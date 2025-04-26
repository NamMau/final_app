const FinancialReport = require('../models/FinancialReport.model');
const User = require('../models/User.model');
const Budget = require('../models/Budget.model');
const Bill = require('../models/Bill.model');
const Transaction = require('../models/Transaction.model');

// Create a new financial report
const createFinancialReport = async (reportData) => {
  try {
    const report = await FinancialReport.create(reportData);
    return report;
  } catch (error) {
    console.error('Error creating financial report:', error);
    throw error;
  }
};

// Get all financial reports for a user
const getFinancialReports = async (userId) => {
  try {
    const reports = await FinancialReport.find({ user: userId })
      .sort({ createdAt: -1 });
    return reports;
  } catch (error) {
    console.error('Error getting financial reports:', error);
    throw error;
  }
};

// Get a specific financial report by ID
const getFinancialReportById = async (reportId) => {
  try {
    const report = await FinancialReport.findById(reportId);
    return report;
  } catch (error) {
    console.error('Error getting financial report:', error);
    throw error;
  }
};

// Generate a financial report based on user data
const generateFinancialReport = async (userId, period = 'month') => {
  try {
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get budgets
    const budgets = await Budget.find({ userId })
      .populate('categoryID');

    // Get paid bills for the specified period
    const bills = await Bill.find({ 
      user: userId,
      status: 'paid'
    }).populate({
      path: 'budget',
      populate: {
        path: 'categoryID'
      }
    });

    // Calculate date range based on period
    const today = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
    }

    // Filter bills by date
    const filteredBills = bills.filter(bill => {
      const billDate = new Date(bill.dueDate);
      return billDate >= startDate && billDate <= today;
    });

    // Get transactions for the period
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: today }
    }).populate('category');

    // Calculate category spending
    const categoryMap = new Map();
    filteredBills.forEach(bill => {
      if (bill.budget?.categoryID) {
        const categoryName = bill.budget.categoryID.categoryName;
        const currentAmount = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, currentAmount + bill.amount);
      }
    });

    // Convert to array and sort
    const categorySpending = Array.from(categoryMap.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        color: getColorForIndex(index)
      }))
      .sort((a, b) => b.amount - a.amount);

    // Calculate budget statuses
    const budgetStatuses = budgets.map(budget => ({
      name: budget.name,
      spent: budget.spent,
      total: budget.amount,
      percentage: (budget.spent / budget.amount) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage);

    // Generate monthly data
    const monthlyData = generateMonthlyData(transactions, period);

    // Calculate totals
    const totalExpenses = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalIncome = user.totalBalance || 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Generate insights
    const insightsData = await generateInsights(categorySpending, budgetStatuses, monthlyData, user.totalBalance, period);

    // Create report data
    const reportData = {
      user: userId,
      date: new Date(),
      period,
      categorySpending,
      budgetStatuses,
      monthlyData,
      insights: insightsData.insights,
      recommendations: insightsData.recommendations,
      totalIncome,
      totalExpenses,
      savingsRate
    };

    // Create and return the report
    const report = await FinancialReport.create(reportData);
    return report;
  } catch (error) {
    console.error('Error generating financial report:', error);
    throw error;
  }
};

// Helper function to generate monthly data
const generateMonthlyData = (transactions, period) => {
  const today = new Date();
  const labels = [];
  const income = [];
  const expenses = [];
  
  // Determine the number of data points based on period
  const dataPoints = period === 'week' ? 7 : period === 'month' ? 30 : 12;
  
  // Generate data points
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date();
    
    if (period === 'year') {
      // For year, go back by months
      date.setMonth(today.getMonth() - i);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      labels.unshift(`${month}/${date.getFullYear().toString().slice(2)}`);
    } else {
      // For week/month, go back by days
      date.setDate(today.getDate() - i);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      labels.unshift(`${day}/${month}`);
    }
    
    // Initialize with zeros
    income.unshift(0);
    expenses.unshift(0);
  }
  
  // Fill with actual transaction data
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    let index;
    
    if (period === 'year') {
      // For year, match by month
      const monthsDiff = (today.getFullYear() - transactionDate.getFullYear()) * 12 + 
                         (today.getMonth() - transactionDate.getMonth());
      index = dataPoints - 1 - monthsDiff;
    } else {
      // For week/month, match by day
      const daysDiff = Math.floor((today - transactionDate) / (1000 * 60 * 60 * 24));
      index = dataPoints - 1 - daysDiff;
    }
    
    if (index >= 0 && index < dataPoints) {
      if (transaction.type === 'income') {
        income[index] += transaction.amount;
      } else {
        expenses[index] += transaction.amount;
      }
    }
  });
  
  return { labels, income, expenses };
};

// Helper function to generate insights
const generateInsights = async (categorySpending, budgetStatuses, monthlyData, balance, period) => {
  try {
    const insights = [];
    const recommendations = [];
    
    console.log('Generating insights with data:', {
      categorySpendingLength: categorySpending ? categorySpending.length : 0,
      budgetStatusesLength: budgetStatuses ? budgetStatuses.length : 0,
      hasMonthlyData: monthlyData && monthlyData.labels ? monthlyData.labels.length > 0 : false,
      balance: balance || 0,
      period
    });
    
    // Check if we have any data at all
    const hasData = (categorySpending && categorySpending.length > 0) || 
                    (budgetStatuses && budgetStatuses.length > 0) || 
                    (monthlyData && monthlyData.labels && monthlyData.labels.length > 0);
    
    // If we have no data, provide general financial advice based on the period
    if (!hasData) {
      if (period === 'week') {
        insights.push(`Weekly financial tracking helps identify immediate spending patterns.`);
        insights.push(`Consider setting small, achievable financial goals for this week.`);
        recommendations.push(`Track your daily expenses to better understand your spending habits.`);
        recommendations.push(`Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.`);
      } else if (period === 'month') {
        insights.push(`Monthly financial reviews help align your spending with your budget.`);
        insights.push(`Regular monthly tracking can help identify recurring expenses to optimize.`);
        recommendations.push(`Create budget categories that match your actual spending patterns.`);
        recommendations.push(`Aim to save at least 20% of your monthly income for financial security.`);
      } else if (period === 'year') {
        insights.push(`Yearly financial analysis helps identify long-term trends and progress.`);
        insights.push(`Annual reviews are perfect for setting major financial goals.`);
        recommendations.push(`Review your investment strategy and retirement contributions annually.`);
        recommendations.push(`Consider diversifying your income sources for greater financial stability.`);
      }
      
      // Add general recommendations regardless of period
      recommendations.push(`Start by tracking all your expenses to get a clear picture of your finances.`);
      
      return {
        insights: insights.slice(0, 4),
        recommendations: recommendations.slice(0, 4)
      };
    }
    
    // 1. Analyze category spending
    if (categorySpending && categorySpending.length > 0) {
      // Find top spending category
      const sortedCategories = [...categorySpending].sort((a, b) => b.amount - a.amount);
      const topCategory = sortedCategories[0];
      const totalSpent = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
      
      if (topCategory && totalSpent > 0) {
        const percentage = Math.round((topCategory.amount / totalSpent) * 100);
        insights.push(`${topCategory.name} is your top spending category at ${percentage}% of total expenses.`);
        
        // Recommendation based on top category
        if (percentage > 40) {
          recommendations.push(`Consider reducing spending in ${topCategory.name} category as it represents ${percentage}% of your total expenses.`);
        }
      }
      
      // Find categories with significant increase
      if (sortedCategories.length > 1) {
        const secondCategory = sortedCategories[1];
        const secondPercentage = Math.round((secondCategory.amount / totalSpent) * 100);
        if (secondPercentage > 20) {
          insights.push(`${secondCategory.name} is your second highest expense at ${secondPercentage}% of total spending.`);
        }
      }
    } else if (balance > 0) {
      // If we have balance but no category spending
      insights.push(`You have a balance of ${formatCurrency(balance)}, but no categorized expenses for this ${period}.`);
      recommendations.push(`Start categorizing your expenses to get more detailed insights.`);
    }
    
    // 2. Analyze budget statuses
    if (budgetStatuses && budgetStatuses.length > 0) {
      // Find budgets that are close to or over threshold
      const overBudgets = budgetStatuses.filter(budget => budget.percentage >= 90);
      const nearBudgets = budgetStatuses.filter(budget => budget.percentage >= 70 && budget.percentage < 90);
      
      if (overBudgets.length > 0) {
        insights.push(`You have ${overBudgets.length} budget${overBudgets.length > 1 ? 's' : ''} that ${overBudgets.length > 1 ? 'are' : 'is'} over 90% spent.`);
        
        // Add specific budget recommendations
        overBudgets.forEach(budget => {
          recommendations.push(`Increase your '${budget.name}' budget or reduce spending as it's currently at ${Math.round(budget.percentage)}% of limit.`);
        });
      }
      
      if (nearBudgets.length > 0) {
        insights.push(`${nearBudgets.length} budget${nearBudgets.length > 1 ? 's are' : ' is'} approaching the limit (70-90% spent).`);
      }
      
      // Find healthy budgets
      const healthyBudgets = budgetStatuses.filter(budget => budget.percentage < 50);
      if (healthyBudgets.length > 0) {
        insights.push(`${healthyBudgets.length} of your budgets are in good health (under 50% spent).`);
      }
    } else {
      // If we have no budget data
      recommendations.push(`Set up budget categories to better monitor your spending patterns.`);
    }
    
    // 3. Analyze income vs expenses
    if (monthlyData && monthlyData.labels && monthlyData.labels.length > 0) {
      const totalIncome = monthlyData.income.reduce((sum, inc) => sum + inc, 0);
      const totalExpenses = monthlyData.expenses.reduce((sum, exp) => sum + exp, 0);
      
      if (totalIncome > 0 && totalExpenses > 0) {
        const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
        
        if (savingsRate > 0) {
          insights.push(`Your savings rate is ${Math.round(savingsRate)}% for this ${period}.`);
          
          // Recommendations based on savings rate
          if (savingsRate < 20) {
            recommendations.push(`Try to increase your savings rate to at least 20% by reducing non-essential expenses.`);
          } else if (savingsRate > 50) {
            recommendations.push(`Consider investing some of your savings as your current savings rate of ${Math.round(savingsRate)}% is excellent.`);
          }
        } else {
          insights.push(`You're spending more than your income this ${period}.`);
          recommendations.push(`Create a stricter budget to avoid spending more than your income.`);
        }
      } else if (totalExpenses > 0) {
        // If we have expenses but no income
        insights.push(`You've spent ${formatCurrency(totalExpenses)} this ${period} without recording any income.`);
        recommendations.push(`Make sure to track your income sources for a complete financial picture.`);
      }
      
      // Analyze spending trends
      if (monthlyData.expenses.length > 2) {
        const lastExpense = monthlyData.expenses[monthlyData.expenses.length - 1];
        const secondLastExpense = monthlyData.expenses[monthlyData.expenses.length - 2];
        
        if (lastExpense > 0 || secondLastExpense > 0) {
          if (lastExpense > secondLastExpense) {
            const increasePercentage = secondLastExpense > 0 ? ((lastExpense - secondLastExpense) / secondLastExpense) * 100 : 100;
            if (increasePercentage > 20) {
              insights.push(`Your spending increased by ${Math.round(increasePercentage)}% compared to the previous period.`);
              recommendations.push(`Review your recent expenses as they've increased significantly by ${Math.round(increasePercentage)}%.`);
            }
          } else if (secondLastExpense > lastExpense) {
            const decreasePercentage = ((secondLastExpense - lastExpense) / secondLastExpense) * 100;
            if (decreasePercentage > 20) {
              insights.push(`You've reduced spending by ${Math.round(decreasePercentage)}% compared to the previous period.`);
            }
          }
        }
      }
    } else {
      // If we have no monthly data
      if (period === 'week') {
        recommendations.push(`Track your daily expenses to see spending patterns throughout the week.`);
      } else if (period === 'month') {
        recommendations.push(`Record your expenses regularly to see monthly spending patterns.`);
      } else {
        recommendations.push(`Consistent expense tracking will help you identify yearly financial trends.`);
      }
    }
    
    // 4. Add general recommendations based on user's balance
    if (balance > 0) {
      // Calculate emergency fund recommendation (3-6 months of expenses)
      let avgMonthlyExpense = 0;
      
      if (categorySpending && categorySpending.length > 0) {
        avgMonthlyExpense = categorySpending.reduce((sum, cat) => sum + cat.amount, 0) / 3; // Assuming data is for 3 months
      } else if (monthlyData && monthlyData.expenses && monthlyData.expenses.length > 0) {
        avgMonthlyExpense = monthlyData.expenses.reduce((sum, exp) => sum + exp, 0) / monthlyData.expenses.length;
      }
      
      if (avgMonthlyExpense > 0) {
        const recommendedEmergencyFund = avgMonthlyExpense * 6;
        
        if (balance < recommendedEmergencyFund) {
          const formatter = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
          });
          recommendations.push(`Build an emergency fund of ${formatter.format(recommendedEmergencyFund)} (6 months of expenses).`);
        }
      }
      
      // Add investment recommendation if balance is substantial
      if (balance > 50000000) { // 50M VND
        recommendations.push(`Consider diversifying your investments as your balance is substantial.`);
      }
    }
    
    // Ensure we have at least some insights and recommendations
    if (insights.length === 0) {
      insights.push(`Not enough data to generate detailed insights for this ${period}.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push(`Continue tracking your expenses to receive personalized recommendations.`);
      recommendations.push(`Set up budget categories to better monitor your spending patterns.`);
    }
    
    // Limit to top 4 insights and recommendations
    return {
      insights: insights.slice(0, 4),
      recommendations: recommendations.slice(0, 4)
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      insights: ["Continue tracking your finances to receive personalized insights."],
      recommendations: ["Set up budget categories to better monitor your spending."]
    };
  }
};

// Helper function to generate recommendations
const generateRecommendations = async (categorySpending, budgetStatuses, savingsRate) => {
  try {
    const recommendations = [];
    
    // We don't need this function anymore as recommendations are now generated in the generateInsights function
    // This is just a placeholder to maintain backward compatibility
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
};

// Helper function to get a color for a category
const getColorForIndex = (index) => {
  const colors = [
    '#1F41BB', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
    '#9966FF', '#FF9F40', '#8AC926', '#FF595E', '#6A4C93'
  ];
  return colors[index % colors.length];
};

// Helper function to format currency
const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount.toLocaleString('vi-VN')} VND`;
  }
};

module.exports = {
  createFinancialReport,
  getFinancialReports,
  getFinancialReportById,
  generateFinancialReport,
  generateInsights
};
