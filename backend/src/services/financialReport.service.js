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
    const budgetStatuses = budgets.map((budget, index) => ({
      name: budget.name,
      spent: budget.spent,
      total: budget.amount,
      percentage: (budget.spent / budget.amount) * 100,
      categoryID: budget.categoryID ? budget.categoryID._id : null,
      color: getColorForIndex(index)
    }))
    .sort((a, b) => b.percentage - a.percentage);
    
    // Generate budget comparisons
    const budgetComparisons = budgets.map((budget, index) => {
      const categoryName = budget.categoryID ? budget.categoryID.categoryName : budget.name;
      const budgetAmount = budget.amount;
      const actualSpent = budget.spent;
      const difference = budgetAmount - actualSpent;
      const percentageOfBudget = (actualSpent / budgetAmount) * 100;
      
      return {
        categoryName,
        budgetAmount,
        actualSpent,
        difference,
        percentageOfBudget,
        color: getColorForIndex(index)
      };
    })
    .sort((a, b) => b.percentageOfBudget - a.percentageOfBudget);

    // Generate monthly data
    const monthlyData = generateMonthlyData(transactions, period);

    // Calculate totals
    const totalExpenses = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
    const totalIncome = user.totalBalance || 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Generate insights
    const insightsData = await generateInsights(categorySpending, budgetStatuses, monthlyData, user.totalBalance, period, budgetComparisons);

    // Create report data
    const reportData = {
      user: userId,
      date: new Date(),
      period,
      categorySpending,
      budgetStatuses,
      budgetComparisons,
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
const generateInsights = async (categorySpending, budgetStatuses, monthlyData, balance, period, budgetComparisons) => {
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
      const overBudgets = budgetStatuses.filter(budget => budget.percentage >= 90);
      const nearBudgets = budgetStatuses.filter(budget => budget.percentage >= 70 && budget.percentage < 90);
      
      if (overBudgets.length > 0) {
        insights.push(`You have ${overBudgets.length} budget${overBudgets.length > 1 ? 's' : ''} that ${overBudgets.length > 1 ? 'are' : 'is'} over 90% spent.`);
        
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
    
    // 3. Analyze budget comparisons
    if (budgetComparisons && budgetComparisons.length > 0) {
      // Find categories that are significantly over budget
      const overBudgetCategories = budgetComparisons.filter(comp => comp.percentageOfBudget > 100);
      // Find categories that are significantly under budget
      const underBudgetCategories = budgetComparisons.filter(comp => comp.percentageOfBudget < 70);
      
      if (overBudgetCategories.length > 0) {
        const worstCategory = overBudgetCategories.sort((a, b) => b.percentageOfBudget - a.percentageOfBudget)[0];
        insights.push(`You've exceeded your '${worstCategory.categoryName}' budget by ${Math.round(worstCategory.percentageOfBudget - 100)}%.`);
        recommendations.push(`Review your spending in '${worstCategory.categoryName}' category and consider adjusting your budget or reducing expenses.`);
        
        if (overBudgetCategories.length > 1) {
          insights.push(`You have ${overBudgetCategories.length} categories where spending exceeds the budget.`);
        }
      }
      
      if (underBudgetCategories.length > 0) {
        const mostUnderCategory = underBudgetCategories.sort((a, b) => a.percentageOfBudget - b.percentageOfBudget)[0];
        insights.push(`You're only using ${Math.round(mostUnderCategory.percentageOfBudget)}% of your '${mostUnderCategory.categoryName}' budget.`);
        
        if (overBudgetCategories.length > 0) {
          recommendations.push(`Consider reallocating some funds from '${mostUnderCategory.categoryName}' to categories where you're over budget.`);
        }
      }
      
      // Calculate overall budget adherence
      const totalBudget = budgetComparisons.reduce((sum, comp) => sum + comp.budgetAmount, 0);
      const totalSpent = budgetComparisons.reduce((sum, comp) => sum + comp.actualSpent, 0);
      
      if (totalBudget > 0) {
        const overallPercentage = (totalSpent / totalBudget) * 100;
        
        if (overallPercentage > 100) {
          insights.push(`Overall, you're spending ${Math.round(overallPercentage - 100)}% more than your total budget.`);
          recommendations.push(`Consider reviewing your entire budget and looking for ways to reduce spending across categories.`);
        } else if (overallPercentage > 90) {
          insights.push(`You're using ${Math.round(overallPercentage)}% of your total budget.`);
          recommendations.push(`You're close to your overall budget limit. Monitor your spending carefully for the rest of the period.`);
        } else if (overallPercentage < 70) {
          insights.push(`You're only using ${Math.round(overallPercentage)}% of your total budget.`);
          recommendations.push(`You might be over-budgeting. Consider adjusting your budget to be more realistic or saving the extra money.`);
        } else {
          insights.push(`Your overall spending is at ${Math.round(overallPercentage)}% of your total budget, which is healthy.`);
        }
      }
    }
    
    // 4. Analyze income vs expenses
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
    
    // Limit to top 5 insights and recommendations, but ensure we include budget comparison insights
    return {
      insights: insights.slice(0, 5),
      recommendations: recommendations.slice(0, 5)
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

/**
 * Detect unusual spending patterns
 * @param {Object} params - Parameters for unusual spending detection
 * @param {string} params.userId - User ID
 * @param {string} params.startDate - Start date for analysis
 * @param {string} params.endDate - End date for analysis
 * @param {number} params.threshold - Threshold percentage for unusual spending (e.g., 150 means 150% of average)
 * @param {boolean} params.includeSeasonalContext - Whether to include seasonal context in analysis
 * @returns {Object} Unusual spending data
 */
const detectUnusualSpending = async ({
  userId,
  startDate,
  endDate,
  threshold,
  includeSeasonalContext
}) => {
  try {
    // Get bills for the analysis period (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const bills = await Bill.find({
      userId,
      date: { $gte: sixMonthsAgo }
    }).sort({ date: -1 });
    
    if (!bills || bills.length === 0) {
      return {
        unusualTransactions: [],
        insights: ['No bills found for analysis']
      };
    }
    
    // Group bills by category and calculate statistics
    const categoryStats = {};
    bills.forEach(bill => {
      if (!categoryStats[bill.category]) {
        categoryStats[bill.category] = {
          transactions: [],
          total: 0,
          count: 0,
          average: 0,
          standardDeviation: 0
        };
      }
      
      categoryStats[bill.category].transactions.push(bill);
      categoryStats[bill.category].total += bill.amount;
      categoryStats[bill.category].count += 1;
    });
    
    // Calculate average and standard deviation for each category
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.average = stats.total / stats.count;
      
      // Calculate standard deviation
      const squaredDifferences = stats.transactions.map(bill => 
        Math.pow(bill.amount - stats.average, 2)
      );
      const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / stats.count;
      stats.standardDeviation = Math.sqrt(variance);
    });
    
    // Find unusual transactions
    const unusualTransactions = [];
    const analysisStartDate = new Date(startDate);
    const analysisEndDate = new Date(endDate);
    
    // Track frequency of unusual transactions per category
    const categoryFrequency = {};
    
    bills.forEach(bill => {
      const billDate = new Date(bill.date);
      
      // Skip bills outside the analysis period
      if (billDate < analysisStartDate || billDate > analysisEndDate) {
        return;
      }
      
      const stats = categoryStats[bill.category];
      if (!stats) return;
      
      // Calculate how much this transaction deviates from the average
      const percentageAboveAverage = ((bill.amount - stats.average) / stats.average) * 100;
      
      // Check if transaction is unusual based on threshold and standard deviation
      const isUnusual = 
        percentageAboveAverage > threshold || 
        (stats.standardDeviation > 0 && 
         bill.amount > stats.average + 2 * stats.standardDeviation);
      
      if (isUnusual) {
        // Track frequency
        if (!categoryFrequency[bill.category]) {
          categoryFrequency[bill.category] = 1;
        } else {
          categoryFrequency[bill.category]++;
        }
        
        // Determine seasonal context if requested
        let seasonalContext = null;
        if (includeSeasonalContext) {
          const month = billDate.getMonth();
          
          // Tet/Holiday season (December-February)
          if (month === 11 || month === 0 || month === 1) {
            seasonalContext = 'Tet/Holiday season';
          }
          // Summer season (June-August)
          else if (month >= 5 && month <= 7) {
            seasonalContext = 'Summer season';
          }
        }
        
        unusualTransactions.push({
          category: bill.category,
          amount: bill.amount,
          percentageAboveAverage: percentageAboveAverage,
          date: bill.date,
          seasonalContext: seasonalContext
        });
      }
    });
    
    // Add frequency information to unusual transactions
    unusualTransactions.forEach(transaction => {
      const frequency = categoryFrequency[transaction.category];
      if (frequency > 1) {
        transaction.frequency = `${frequency} unusual transactions in this category`;
      }
    });
    
    // Sort by percentage above average (descending)
    unusualTransactions.sort((a, b) => b.percentageAboveAverage - a.percentageAboveAverage);
    
    // Generate insights
    const insights = generateUnusualSpendingInsights(unusualTransactions, categoryFrequency);
    
    return {
      unusualTransactions,
      insights
    };
  } catch (error) {
    console.error('Error detecting unusual spending:', error);
    throw new Error('Failed to detect unusual spending patterns');
  }
};

/**
 * Generate insights from unusual spending data
 * @param {Array} unusualTransactions - List of unusual transactions
 * @param {Object} categoryFrequency - Frequency of unusual transactions by category
 * @returns {Array} List of insights
 */
const generateUnusualSpendingInsights = (unusualTransactions, categoryFrequency) => {
  const insights = [];
  
  if (unusualTransactions.length === 0) {
    insights.push('No unusual spending patterns detected.');
    return insights;
  }
  
  // Most affected category
  const mostAffectedCategory = Object.entries(categoryFrequency)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (mostAffectedCategory) {
    insights.push(
      `${mostAffectedCategory[0]} has the most unusual transactions (${mostAffectedCategory[1]}).`
    );
  }
  
  // Seasonal patterns
  const seasonalItems = unusualTransactions.filter(item => item.seasonalContext);
  if (seasonalItems.length > 0) {
    const seasonalCounts = {};
    seasonalItems.forEach(item => {
      if (!seasonalCounts[item.seasonalContext]) {
        seasonalCounts[item.seasonalContext] = 0;
      }
      seasonalCounts[item.seasonalContext]++;
    });
    
    Object.entries(seasonalCounts).forEach(([season, count]) => {
      insights.push(
        `${count} unusual transaction${count !== 1 ? 's' : ''} occurred during ${season}.`
      );
    });
  }
  
  // Highest deviation
  if (unusualTransactions.length > 0) {
    const highestDeviation = unusualTransactions[0];
    insights.push(
      `Highest deviation: ${highestDeviation.category} at +${Math.round(highestDeviation.percentageAboveAverage)}% above average.`
    );
  }
  
  return insights;
};

/**
 * Generate spending optimization recommendations for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of spending optimization recommendations
 */
const getSpendingOptimizations = async (userId) => {
  try {
    // Get transactions from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const transactionService = require('./transaction.service');
    
    // Get user transactions for the past 6 months
    const transactions = await transactionService.getUserTransactions(userId, {
      startDate: sixMonthsAgo,
      endDate: new Date()
    });
    
    // For bills, we'll use transactions with bill references or in bill-related categories
    const billTransactions = transactions.filter(t => 
      t.bill || 
      (t.category && t.category.categoryName && 
        ['Bills', 'Utilities', 'Rent', 'Mortgage', 'Insurance'].some(cat => 
          t.category.categoryName.includes(cat)
        )
      )
    );
    
    // Generate recommendations based on transaction data
    const recommendations = await generateSpendingRecommendations(transactions, billTransactions);
    
    return recommendations;
  } catch (error) {
    console.error('Error generating spending optimization recommendations:', error);
    throw new Error('Failed to generate spending optimization recommendations');
  }
};

/**
 * Generate spending optimization recommendations based on transaction data
 * @param {Array} transactions - User transactions
 * @param {Array} billTransactions - Transactions related to bills
 * @returns {Array} - Array of spending optimization recommendations
 */
const generateSpendingRecommendations = async (transactions, billTransactions) => {
  // Initialize recommendations array
  const recommendations = [];
  
  // Skip if not enough data
  if (!transactions || transactions.length < 10) {
    return recommendations;
  }
  
  try {
    // Group transactions by category
    const categoriesMap = {};
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' || transaction.type === 'bill_payment') {
        const categoryName = transaction.category && transaction.category.categoryName ? 
          transaction.category.categoryName : 'Uncategorized';
        
        if (!categoriesMap[categoryName]) {
          categoriesMap[categoryName] = [];
        }
        categoriesMap[categoryName].push(transaction);
      }
    });
    
    // Find top spending categories
    const topCategories = Object.entries(categoriesMap)
      .map(([category, transactions]) => ({
        category,
        total: transactions.reduce((sum, t) => sum + t.amount, 0),
        count: transactions.length
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    // Analyze day of week patterns
    const dayOfWeekSpending = Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const date = new Date(transaction.date);
        const dayOfWeek = date.getDay();
        dayOfWeekSpending[dayOfWeek] += transaction.amount;
      }
    });
    
    // Find most expensive day
    const mostExpensiveDay = dayOfWeekSpending.indexOf(Math.max(...dayOfWeekSpending));
    
    // Find potential subscriptions
    const potentialSubscriptions = findPotentialSubscriptions(transactions);
    
    // Generate recommendations based on the analysis
    
    // 1. High spending category recommendation
    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      const monthlyAverage = topCategory.total / 6; // 6 months of data
      
      recommendations.push({
        id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'cut_spending',
        title: `Reduce ${topCategory.category} Expenses`,
        description: `You've spent $${topCategory.total.toFixed(2)} on ${topCategory.category} in the last 6 months (avg. $${(monthlyAverage).toFixed(2)}/month). Consider setting a budget to reduce this by 15%.`,
        potentialSavings: Math.round(monthlyAverage * 0.15),
        category: topCategory.category,
        relevanceScore: 95,
        implementationDifficulty: 'medium',
        icon: 'trending-down',
        color: '#FF6B6B'
      });
    }
    
    // 2. Day of week optimization
    if (mostExpensiveDay !== -1) {
      const cheapestDay = dayOfWeekSpending.indexOf(Math.min(...dayOfWeekSpending.filter(amount => amount > 0)));
      
      if (cheapestDay !== -1 && mostExpensiveDay !== cheapestDay) {
        const savings = (dayOfWeekSpending[mostExpensiveDay] - dayOfWeekSpending[cheapestDay]) / 26; // 26 weeks in 6 months
        
        recommendations.push({
          id: `day-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'time_optimization',
          title: `Shop on ${dayNames[cheapestDay]} Instead`,
          description: `You tend to spend more on ${dayNames[mostExpensiveDay]}s. Consider shifting your shopping to ${dayNames[cheapestDay]}s, when you historically spend less.`,
          potentialSavings: Math.round(savings),
          category: 'Shopping',
          relevanceScore: 85,
          implementationDifficulty: 'easy',
          icon: 'calendar',
          color: '#4ECDC4'
        });
      }
    }
    
    // 3. Subscription optimization
    if (potentialSubscriptions.length > 0) {
      // Find the subscription with the highest monthly cost
      const topSubscription = potentialSubscriptions.sort((a, b) => b.monthlyAmount - a.monthlyAmount)[0];
      
      recommendations.push({
        id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'service_replacement',
        title: `Review ${topSubscription.name} Subscription`,
        description: `You're spending about $${topSubscription.monthlyAmount.toFixed(2)} monthly on ${topSubscription.name}. Consider if you're getting enough value or if there are cheaper alternatives.`,
        potentialSavings: Math.round(topSubscription.monthlyAmount * 0.5), // Assume 50% savings from canceling or finding alternative
        category: topSubscription.category,
        relevanceScore: 90,
        implementationDifficulty: 'medium',
        icon: 'repeat',
        color: '#1F41BB'
      });
    }
    
    // 4. Food expense optimization (if applicable)
    const foodCategory = topCategories.find(cat => 
      ['Food', 'Dining', 'Restaurants', 'Groceries', 'Buying foods'].some(foodCat => 
        cat.category && cat.category.includes(foodCat)
      )
    );
    
    if (foodCategory) {
      const monthlyFoodExpense = foodCategory.total / 6;
      
      recommendations.push({
        id: `food-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'habit_change',
        title: 'Meal Prep Savings',
        description: `Preparing meals at home instead of eating out could save you up to 70% on food expenses. Based on your current spending, that's a significant monthly saving.`,
        potentialSavings: Math.round(monthlyFoodExpense * 0.3),
        category: foodCategory.category,
        relevanceScore: 80,
        implementationDifficulty: 'medium',
        icon: 'restaurant',
        color: '#FF9F1C'
      });
    }
    
    // 5. Bill negotiation (if applicable)
    if (billTransactions && billTransactions.length > 0) {
      // Find recurring bill transactions that might be negotiable
      const negotiableBillCategories = ['Utilities', 'Internet', 'Phone', 'Insurance', 'Subscription', 'Electricity', 'Water'];
      const negotiableBills = billTransactions.filter(transaction => 
        negotiableBillCategories.some(category => 
          (transaction.category && transaction.category.categoryName && 
            transaction.category.categoryName.includes(category)) || 
          (transaction.description && transaction.description.includes(category)) ||
          (transaction.bill && transaction.bill.billName && 
            negotiableBillCategories.some(cat => transaction.bill.billName.includes(cat)))
        )
      );
      
      // If no specific negotiable bills found, use any bill transactions as a fallback
      const billsToUse = negotiableBills.length > 0 ? negotiableBills : billTransactions;
      
      if (billsToUse.length > 0) {
        // Calculate average monthly bill amount
        const totalBillAmount = billsToUse.reduce((sum, bill) => sum + bill.amount, 0);
        const avgMonthlyBill = totalBillAmount / billsToUse.length;
        
        recommendations.push({
          id: `bill-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'reallocate_budget',
          title: 'Negotiate Service Bills',
          description: `Many service providers will offer discounts if you call and negotiate. Consider calling your providers to request better rates on your recurring bills.`,
          potentialSavings: Math.round(avgMonthlyBill * 0.15), // Assume 15% savings from negotiation
          category: 'Bills',
          relevanceScore: 75,
          implementationDifficulty: 'easy',
          icon: 'call',
          color: '#45B7D1'
        });
      }
    }
    
    // Sort recommendations by relevance score (highest first)
    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  } catch (error) {
    console.error('Error generating spending recommendations:', error);
    return [];
  }
};

/**
 * Find potential subscription services in transaction history
 * @param {Array} transactions - User transactions
 * @returns {Array} - Array of potential subscription services
 */
const findPotentialSubscriptions = (transactions) => {
  const subscriptions = [];
  const potentialSubscriptionMap = {};
  
  // Look for transactions with similar amounts and descriptions
  transactions.forEach(transaction => {
    if (transaction.type !== 'expense' && transaction.type !== 'bill_payment') return;
    
    // Create a key based on amount and partial description
    const amount = Math.round(transaction.amount * 100) / 100; // Round to 2 decimal places
    const descriptionWords = transaction.description ? transaction.description.split(' ') : [];
    const firstTwoWords = descriptionWords.slice(0, 2).join(' ').toLowerCase();
    const key = `${firstTwoWords}-${amount}`;
    
    if (!potentialSubscriptionMap[key]) {
      potentialSubscriptionMap[key] = {
        transactions: [],
        amount,
        description: transaction.description || '',
        category: transaction.category && transaction.category.categoryName ? 
          transaction.category.categoryName : 'Uncategorized'
      };
    }
    
    potentialSubscriptionMap[key].transactions.push(transaction);
  });
  
  // Filter for recurring patterns (at least 3 occurrences)
  Object.values(potentialSubscriptionMap).forEach(sub => {
    if (sub.transactions.length >= 3) {
      // Check if the transactions occur at regular intervals
      const dates = sub.transactions.map(t => new Date(t.date).getTime()).sort();
      let isRegular = true;
      
      // Calculate average interval between transactions
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push(dates[i] - dates[i-1]);
      }
      
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const monthInMs = 30 * 24 * 60 * 60 * 1000;
      
      // Check if average interval is roughly monthly (between 25 and 35 days)
      if (avgInterval >= 0.8 * monthInMs && avgInterval <= 1.2 * monthInMs) {
        subscriptions.push({
          name: sub.description.split(' ').slice(0, 3).join(' '),
          monthlyAmount: sub.amount,
          category: sub.category,
          occurrences: sub.transactions.length
        });
      }
    }
  });
  
  return subscriptions;
};

module.exports = {
  createFinancialReport,
  getFinancialReports,
  getFinancialReportById,
  generateFinancialReport,
  generateInsights,
  detectUnusualSpending,
  getSpendingOptimizations
};
