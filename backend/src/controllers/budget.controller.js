// controllers/budget.controller.js
const budgetService = require("../services/budget.service");

exports.createBudget = async (req, res) => {
    try {
        const { 
            userID, 
            categoryID, 
            name,
            amount, 
            period,
            startDate, 
            endDate,
            alertThreshold 
        } = req.body;
        
        const budget = await budgetService.createBudget({
            userID,
            categoryID,
            name,
            amount,
            period,
            startDate,
            endDate,
            alertThreshold
        });
        
        res.status(201).json({ success: true, data: {budget} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getBudgetById = async (req, res) => {
    try {
        const budget = await budgetService.getBudgetById(req.params.id);
        if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });
        res.status(200).json({ success: true, data: {budget} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBudgetById = async (req, res) => {
    try {
        const { 
            name,
            amount, 
            spent,
            period,
            startDate, 
            endDate,
            alertThreshold,
            isActive 
        } = req.body;
        
        const updatedBudget = await budgetService.updateBudget(req.params.id, {
            name,
            amount,
            spent,
            period,
            startDate,
            endDate,
            alertThreshold,
            isActive
        });
        
        res.status(200).json({ success: true, data: {updatedBudget} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteBudgetById = async (req, res) => {
    try {
        await budgetService.deleteBudget(req.params.id);
        res.status(200).json({ 
            success: true, 
            message: "Budget deleted successfully", 
            data: null 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserBudgets = async (req, res) => {
    try {
        const { userID } = req.params;
        const { period, isActive } = req.query;
        const budgets = await budgetService.getUserBudgets(userID, { period, isActive });
        res.status(200).json({ success: true, data: {budgets} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllBudgets = async (req, res) => {
    try {
        const budgets = await budgetService.getAllBudgets();
        res.status(200).json({ success: true, data: {budgets} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};