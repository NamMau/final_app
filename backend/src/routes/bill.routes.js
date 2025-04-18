const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const billController = require('../controllers/bill.controller');

// Basic CRUD routes
router.post('/create-bill', authMiddleware, billController.createBill);
router.get('/getallbills', authMiddleware, billController.getBills);
router.get('/get-bill/:id', authMiddleware, billController.getBillById);
router.put('/update-bill/:id', authMiddleware, billController.updateBill);
router.delete('/delete-bill/:id', authMiddleware, billController.deleteBill);

// Bill status management
router.put('/:id/status', authMiddleware, billController.updateBillStatus);

// Expense tracking routes
router.get('/summary', authMiddleware, billController.getExpenseSummary);
router.get('/trends', authMiddleware, billController.getExpenseTrends);

// Bill scanning routes
router.post('/scan', authMiddleware, billController.scanBill);
router.put('/scan/:id', authMiddleware, billController.updateScannedBill);

module.exports = router;
