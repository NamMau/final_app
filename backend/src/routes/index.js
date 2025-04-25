const express = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const billRoutes = require("./bill.routes");
const categoryRoutes = require("./category.routes");
const budgetRoutes = require("./budget.routes");
const loanRoutes = require("./loan.routes");
const goalRoutes = require("./goal.routes");
const notificationRoutes = require("./notification.routes");
const accountRoutes = require("./account.routes");
const transactionRoutes = require("./transaction.routes");

const router = express.Router();

// API v1 routes
router.use("/v1/auth", authRoutes);
router.use("/v1/users", userRoutes);
router.use("/v1/categories", categoryRoutes);
router.use("/v1/budgets", budgetRoutes);
router.use("/v1/accounts", accountRoutes);
router.use("/v1/goals", goalRoutes);
router.use("/v1/loans", loanRoutes);
router.use("/v1/bills", billRoutes);
router.use("/v1/notifications", notificationRoutes);
router.use("/v1/transactions", transactionRoutes);

module.exports = router;
