// controllers/loan.controller.js
const loanService = require("../services/loan.service");

exports.createLoan = async (req, res) => {
    try {
        const loan = await loanService.createLoan(req.body);
        res.status(201).json({ success: true, data: loan });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getLoanById = async (req, res) => {
    try {
        const loan = await loanService.getLoanById(req.params.id);
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
        res.status(200).json({ success: true, data: loan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllLoans = async (req, res) => {
    try {
        const loans = await loanService.getAllLoans();
        res.status(200).json({ success: true, data: loans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteLoanById = async (req, res) => {
    try {
        const loan = await loanService.deleteLoan(req.params.id);
        if (!loan) return res.status(404).json({ success: false, message: "Loan not found" });
        res.status(200).json({ success: true, message: "Loan deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
