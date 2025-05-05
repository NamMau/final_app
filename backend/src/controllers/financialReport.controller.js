const financialReportService = require('../services/financialReport.service');
const { handleError } = require('../utils/errorHandler');

// Create a new financial report
const createFinancialReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { 
      period, 
      categorySpending,
      budgetStatuses,
      monthlyData,
      insights,
      recommendations,
      totalIncome,
      totalExpenses,
      savingsRate
    } = req.body;
    
    console.log('Received financial report data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Period is required'
      });
    }
    
    // Create the report with validated data
    const report = await financialReportService.createFinancialReport({
      user: userId,
      date: new Date(),
      period: period || 'month',
      categorySpending: Array.isArray(categorySpending) ? categorySpending : [],
      budgetStatuses: Array.isArray(budgetStatuses) ? budgetStatuses : [],
      monthlyData: monthlyData || { labels: [], income: [], expenses: [] },
      insights: Array.isArray(insights) ? insights : [],
      recommendations: Array.isArray(recommendations) ? recommendations : [],
      totalIncome: Number(totalIncome) || 0,
      totalExpenses: Number(totalExpenses) || 0,
      savingsRate: Number(savingsRate) || 0
    });
    
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error creating financial report:', error);
    handleError(res, error);
  }
};

// Get all financial reports for a user
const getFinancialReports = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const reports = await financialReportService.getFinancialReports(userId);
    
    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get a specific financial report by ID
const getFinancialReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await financialReportService.getFinancialReportById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Financial report not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Generate a financial report based on user data
const generateFinancialReport = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { period } = req.query;
    
    const report = await financialReportService.generateFinancialReport(
      userId,
      period || 'month'
    );
    
    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Generate insights and recommendations based on financial data
const generateInsights = async (req, res) => {
  try {
    const { 
      period, 
      categorySpending,
      budgetStatuses,
      budgetComparisons,
      monthlyData,
      balance
    } = req.body;
    
    console.log('Received request for insights with data:', {
      period,
      categorySpendingLength: categorySpending ? categorySpending.length : 0,
      budgetStatusesLength: budgetStatuses ? budgetStatuses.length : 0,
      budgetComparisonsLength: budgetComparisons ? budgetComparisons.length : 0,
      hasMonthlyData: monthlyData && monthlyData.labels ? monthlyData.labels.length > 0 : false,
      balance: balance || 0
    });
    
    // Validate required fields
    if (!period || !categorySpending || !budgetStatuses || !monthlyData) {
      console.warn('Missing required data for generating insights');
      return res.status(400).json({
        success: false,
        message: 'Missing required data for generating insights',
        data: {
          insights: ['Not enough data to generate insights'],
          recommendations: ['Please provide more financial information']
        }
      });
    }
    
    // Generate insights using the service method
    const insightsData = await financialReportService.generateInsights(
      categorySpending,
      budgetStatuses,
      monthlyData,
      balance || 0,
      period,
      budgetComparisons
    );
    
    console.log('Generated insights:', {
      insightsCount: insightsData.insights ? insightsData.insights.length : 0,
      recommendationsCount: insightsData.recommendations ? insightsData.recommendations.length : 0,
      firstInsight: insightsData.insights && insightsData.insights.length > 0 ? insightsData.insights[0] : null
    });
    
    res.status(200).json({
      success: true,
      data: insightsData
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      data: {
        insights: ['Failed to generate insights'],
        recommendations: ['Please try again later']
      }
    });
  }
};

/**
 * Detect unusual spending patterns
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const detectUnusualSpending = async (req, res) => {
  try {
    const { startDate, endDate, threshold, includeSeasonalContext } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!startDate || !endDate || !threshold) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: startDate, endDate, or threshold',
      });
    }

    // Call service to detect unusual spending
    const unusualSpendingData = await financialReportService.detectUnusualSpending({
      userId,
      startDate,
      endDate,
      threshold: parseFloat(threshold),
      includeSeasonalContext: includeSeasonalContext === true
    });

    return res.status(200).json({
      success: true,
      data: unusualSpendingData,
      message: 'Unusual spending patterns detected successfully',
    });
  } catch (error) {
    console.error('Error detecting unusual spending:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to detect unusual spending patterns',
    });
  }
};

/**
 * Get spending optimization recommendations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSpendingOptimizations = async (req, res) => {
  try {
    // Extract userId from the authenticated user object
    // Make sure we're using the string representation of the ID
    const userId = req.user.id || req.user._id.toString();

    console.log('Getting spending optimizations for user:', userId);

    // Get spending optimization recommendations
    const recommendations = await financialReportService.getSpendingOptimizations(userId);

    return res.status(200).json({
      success: true,
      data: recommendations,
      message: 'Spending optimization recommendations generated successfully',
    });
  } catch (error) {
    console.error('Error generating spending optimization recommendations:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate spending optimization recommendations',
    });
  }
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
