const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authMiddleware } = require("../middlewares/auth.middleware");

router.use(authMiddleware);

router.get('/', authMiddleware, transactionController.getUserTransactions);
router.get('/stats', authMiddleware, transactionController.getTransactionStats);

module.exports = router;
