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

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/bills", billRoutes);
router.use("/categories", categoryRoutes);
router.use("/budgets", budgetRoutes);
router.use("/loans", loanRoutes);
router.use("/goals", goalRoutes);
router.use("/notifications", notificationRoutes);
router.use("/account", accountRoutes);

module.exports = router;
