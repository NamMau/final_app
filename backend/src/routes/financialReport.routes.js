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

// Generate a financial report based on user data - this must come before the :reportId route
router.get('/generate', financialReportController.generateFinancialReport);

// Get a specific financial report by ID
router.get('/:reportId', financialReportController.getFinancialReportById);

// Generate insights
router.post('/insights', authMiddleware, financialReportController.generateInsights);

module.exports = router;
