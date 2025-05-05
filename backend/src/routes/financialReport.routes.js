const express = require('express');
const router = express.Router();
const financialReportController = require('../controllers/financialReport.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new financial report
router.post('/', financialReportController.createFinancialReport);

// Get all financial reports for a user
router.get('/', financialReportController.getFinancialReports);

// Generate a financial report based on user data
router.get('/generate', financialReportController.generateFinancialReport);

// Generate insights
router.post('/insights', financialReportController.generateInsights);

// Detect unusual spending patterns
router.post('/unusual-spending', financialReportController.detectUnusualSpending);

// Get spending optimization recommendations
router.get('/spending-optimization', financialReportController.getSpendingOptimizations);

// Get a specific financial report by ID - this must come after all other specific routes
router.get('/:reportId', financialReportController.getFinancialReportById);

module.exports = router;
