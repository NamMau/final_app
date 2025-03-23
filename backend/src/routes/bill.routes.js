const express = require('express');
const router = express.Router();
const billController = require('../controllers/bill.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication to all routes
router.use(authMiddleware);

// Bill routes
router.post('/', billController.createBill);
router.get('/', billController.getBills);
router.get('/:id', billController.getBillById);
router.put('/:id', billController.updateBillById);
router.delete('/:id', billController.deleteBillById);
router.delete('/', billController.deleteBills);

// Bill scanning routes
router.post('/scan', billController.scanBill);
router.put('/scan/:id', billController.updateScannedBill);

module.exports = router;
