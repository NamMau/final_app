// controllers/budget.controller.js
const budgetService = require("../services/budget.service");

exports.createBudget = async (req, res) => {
    try {
        const userId = req.user.id; // Get from authenticated user
        const { 
            categoryID, 
            name,
            amount, 
            period,
            startDate, 
            endDate,
            alertThreshold 
        } = req.body;
        
        console.log('Creating budget with data:', { userId, categoryID, name, amount, period });
        
        const budget = await budgetService.createBudget({
            userId,
            categoryID,
            name,
            amount,
            period,
            startDate: startDate || new Date(),
            endDate,
            alertThreshold
        });
        
        res.status(201).json({ 
            success: true, 
            data: budget // Return budget directly
        });
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.getBudgetById = async (req, res) => {
    try {
        const budget = await budgetService.getBudgetById(req.params.id);
        if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });
        res.status(200).json({ success: true, data: budget });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBudget = async (req, res) => {
    try {
        const userId = req.user.id; // Get from authenticated user
        const budgetId = req.params.id;

        // First verify the budget belongs to the user
        const budget = await budgetService.getBudgetById(budgetId);
        if (!budget) {
            return res.status(404).json({ 
                success: false, 
                message: 'Budget not found' 
            });
        }

        if (budget.userId.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this budget' 
            });
        }

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
        
        console.log('Updating budget:', { budgetId, name, amount, spent, period });
        
        const updatedBudget = await budgetService.updateBudget(budgetId, {
            name,
            amount,
            spent,
            period,
            startDate,
            endDate,
            alertThreshold,
            isActive
        });
        
        res.status(200).json({ 
            success: true, 
            data: updatedBudget // Return updated budget directly
        });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.deleteBudget = async (req, res) => {
    try {
        const userId = req.user.id; // Get from authenticated user
        const budgetId = req.params.id;

        // First verify the budget belongs to the user
        const budget = await budgetService.getBudgetById(budgetId);
        if (!budget) {
            return res.status(404).json({ 
                success: false, 
                message: 'Budget not found' 
            });
        }

        if (budget.userId.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this budget' 
            });
        }

        await budgetService.deleteBudget(budgetId);
        
        res.status(200).json({ 
            success: true, 
            message: 'Budget deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.getBudgets = async (req, res) => {
    try {
        const userId = req.user.id; // Get from authenticated user
        const { 
            categoryID, 
            period, 
            isActive,
            startDate,
            endDate 
        } = req.query;

        console.log('Getting budgets with filters:', { categoryID, period, isActive, startDate, endDate });
        
        const budgets = await budgetService.getBudgets(userId, { 
            categoryID, 
            period, 
            isActive: isActive === 'true',
            startDate,
            endDate
        });

        res.status(200).json({ 
            success: true, 
            data: budgets // Return budgets directly
        });
    } catch (error) {
        console.error('Error getting budgets:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.getAllBudgets = async (req, res) => {
    try {
        const budgets = await budgetService.getAllBudgets();
        res.status(200).json({ success: true, data: budgets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};