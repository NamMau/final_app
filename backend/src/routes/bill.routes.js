const express = require('express');
const router = express.Router();
const billController = require('../controllers/bill.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Bill routes
router.post('/create-bill', billController.createBill);
router.get('/get-all-bills', billController.getBills);
router.get('/get-bill-by-id/:id', billController.getBillById);
router.put('/update-bill-by-id/:id', billController.updateBillById);
router.delete('/delete-bill/:id', billController.deleteBillById);
router.delete('/delete-bills', billController.deleteBills);

// Bill scanning routes
router.post('/scan', billController.scanBill);
router.put('/scan/:id', billController.updateScannedBill);

module.exports = router;
