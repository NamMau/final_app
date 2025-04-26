const express = require("express");
const { 
    createLoan, 
    getUserLoans, 
    updateLoan, 
    deleteLoan,
    createLoanWithGoal,
    generatePaymentSchedule,
    recordLoanPayment,
    getLoanById
} = require("../controllers/loan.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// Basic loan operations
router.post("/create-loan", authMiddleware, createLoan);
router.get("/get-user-loans/:userId", authMiddleware, getUserLoans);
router.get("/get-loan-by-id/:loanId", authMiddleware, getLoanById);
router.put("/update-loan/:id", authMiddleware, updateLoan);
router.delete("/delete-loan/:id", authMiddleware, deleteLoan);

// Advanced loan operations with goal integration
router.post("/create-with-goal", authMiddleware, createLoanWithGoal);
router.post("/payment-schedule", authMiddleware, generatePaymentSchedule);
router.post("/record-payment/:loanId", authMiddleware, recordLoanPayment);

module.exports = router;
