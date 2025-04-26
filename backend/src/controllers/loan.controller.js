// controllers/loan.controller.js
const loanService = require("../services/loan.service");

exports.createLoan = async (req, res) => {
    try {
        const { 
            userId,
            goalID,
            loanName,
            loanAmount,
            interestRate,
            startDate,
            endDate,
            monthlyPayment,
            paymentSchedule 
        } = req.body;
        
        const loan = await loanService.createLoan({
            userId,
            goalID,
            loanName,
            loanAmount,
            interestRate,
            startDate,
            endDate,
            monthlyPayment,
            paymentSchedule
        });
        
        res.status(201).json({ success: true, data: loan });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getUserLoans = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;
        const loans = await loanService.getUserLoans(userId, { status });
        res.status(200).json({ success: true, data: {loans} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateLoan = async (req, res) => {
    try {
        const { 
            loanName,
            loanAmount,
            remainingBalance,
            interestRate,
            startDate,
            endDate,
            monthlyPayment,
            status,
            paymentSchedule 
        } = req.body;
        
        const loan = await loanService.updateLoan(req.params.id, {
            loanName,
            loanAmount,
            remainingBalance,
            interestRate,
            startDate,
            endDate,
            monthlyPayment,
            status,
            paymentSchedule
        });
        
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
        res.status(200).json({ success: true, data: {loan} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteLoan = async (req, res) => {
    try {
        const loan = await loanService.deleteLoan(req.params.id);
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
        res.status(200).json({ success: true, message: "Loan deleted successfully", data: null});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a loan with an associated repayment goal
exports.createLoanWithGoal = async (req, res) => {
    try {
        const { 
            userId,
            loanName,
            loanAmount,
            interestRate,
            startDate,
            endDate,
            monthlyPayment,
            description
        } = req.body;
        
        const result = await loanService.createLoanWithGoal({
            userId,
            loanName,
            loanAmount,
            interestRate,
            startDate,
            endDate,
            monthlyPayment,
            description
        });
        
        res.status(201).json({ 
            success: true, 
            message: "Loan created with repayment goal",
            data: result 
        });
    } catch (error) {
        console.error('Error creating loan with goal:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Generate a payment schedule for a loan
exports.generatePaymentSchedule = async (req, res) => {
    try {
        const { 
            loanAmount,
            interestRate,
            startDate,
            endDate,
            monthlyPayment
        } = req.body;
        
        const schedule = await loanService.generatePaymentSchedule(
            loanAmount,
            interestRate,
            startDate,
            endDate,
            monthlyPayment
        );
        
        res.status(200).json({ 
            success: true, 
            data: schedule 
        });
    } catch (error) {
        console.error('Error generating payment schedule:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Record a payment for a loan
exports.recordLoanPayment = async (req, res) => {
    try {
        const { loanId } = req.params;
        const { 
            paymentIndex,
            paymentAmount,
            paymentDate
        } = req.body;
        
        const result = await loanService.recordLoanPayment(
            loanId,
            paymentIndex,
            paymentAmount,
            paymentDate
        );
        
        res.status(200).json({ 
            success: true, 
            message: "Payment recorded successfully",
            data: result 
        });
    } catch (error) {
        console.error('Error recording loan payment:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};
