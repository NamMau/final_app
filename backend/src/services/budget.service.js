const Budget = require("../models/Budget.model");
const Category = require("../models/Category.model");

class BudgetError extends Error {
    constructor(message, budgetId, currentSpent, budgetAmount, threshold) {
        super(message);
        this.name = 'BudgetError';
        this.budgetId = budgetId;
        this.currentSpent = currentSpent;
        this.budgetAmount = budgetAmount;
        this.threshold = threshold;
    }
}

const updateBudgetSpent = async (categoryId, amount) => {
    try {
        // Find active budget for the category
        const currentDate = new Date();
        const budget = await Budget.findOne({
            categoryID: categoryId,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate },
            isActive: true
        });

        if (!budget) {
            return null;
        }

        // Calculate new spent amount
        const newSpent = budget.spent + amount;
        const spentPercentage = (newSpent / budget.amount) * 100;

        // Check if exceeds threshold
        if (spentPercentage >= budget.alertThreshold) {
            throw new BudgetError(
                'Budget threshold exceeded',
                budget._id,
                newSpent,
                budget.amount,
                budget.alertThreshold
            );
        }

        // Update budget
        budget.spent = newSpent;
        await budget.save();

        return {
            budgetId: budget._id,
            spent: newSpent,
            total: budget.amount,
            percentage: spentPercentage
        };
    } catch (error) {
        if (error instanceof BudgetError) {
            throw error;
        }
        throw new Error('Failed to update budget spent amount');
    }
};

const calculateBudgetDates = (period, startDate = new Date(), endDate) => {
    const start = new Date(startDate);
    let end;

    switch (period) {
        case 'weekly':
            end = new Date(start);
            end.setDate(start.getDate() + 7);
            break;
        case 'monthly':
            end = new Date(start);
            end.setMonth(start.getMonth() + 1);
            break;
        case 'yearly':
            end = new Date(start);
            end.setFullYear(start.getFullYear() + 1);
            break;
        default:
            throw new Error('Invalid period');
    }

    // If endDate is provided and it's after the calculated end date, use it instead
    if (endDate && new Date(endDate) > end) {
        end = new Date(endDate);
    }

    return { startDate: start, endDate: end };
};

exports.createBudget = async ({ userId, categoryID, name, amount, spent = 0, period, startDate, endDate, alertThreshold = 80, isActive = true }) => {
    console.log('Creating budget with data:', { userId, categoryID, name, amount, period });
    
    // Validate period and set correct start/end dates
    const validatedDates = calculateBudgetDates(period, startDate, endDate);
    
    const budget = await Budget.create({
        userId,  // Fixed: using correct field name
        categoryID, // Fixed: using correct field name
        name,
        amount,
        spent,
        period,
        startDate: validatedDates.startDate,
        endDate: validatedDates.endDate,
        alertThreshold,
        isActive
    });

    // Populate categoryID and return
    return await budget.populate('categoryID');
};

exports.getBudgets = async (userId, filters = {}) => {
    const query = { userId }; // Fixed: using correct field name
    
    // Apply filters
    if (filters.categoryID) query.categoryID = filters.categoryID;
    if (filters.period) query.period = filters.period;
    if (filters.isActive === true || filters.isActive === false) query.isActive = filters.isActive;
    
    // Date filtering
    if (filters.startDate || filters.endDate) {
        query.$or = [
            // Budgets that start within the range
            {
                startDate: {
                    $gte: new Date(filters.startDate || '1970-01-01'),
                    $lte: new Date(filters.endDate || '2100-12-31')
                }
            },
            // Budgets that end within the range
            {
                endDate: {
                    $gte: new Date(filters.startDate || '1970-01-01'),
                    $lte: new Date(filters.endDate || '2100-12-31')
                }
            }
        ];
    }

    console.log('Getting budgets with query:', query);
    const budgets = await Budget.find(query)
        .populate('categoryID') // Fixed: using correct field name
        .sort({ startDate: -1 });
    
    // Calculate progress for each budget
    const budgetsWithProgress = budgets.map(budget => {
        const progress = (budget.spent / budget.amount) * 100;
        const isOverBudget = progress > 100;
        const isNearThreshold = progress >= budget.alertThreshold;
        
        return {
            ...budget.toObject(),
            progress,
            isOverBudget,
            isNearThreshold
        };
    });

    return budgetsWithProgress;
};

exports.updateBudget = async (budgetID, { name, amount, spent, period, startDate, endDate, alertThreshold, isActive }) => {
    const updateData = {};
    if (name) updateData.name = name;
    if (amount) updateData.amount = amount;
    if (spent !== undefined) updateData.spent = spent;
    if (period) {
        updateData.period = period;
        // Recalculate dates if period changes
        const validatedDates = calculateBudgetDates(period, startDate || new Date(), endDate);
        updateData.startDate = validatedDates.startDate;
        updateData.endDate = validatedDates.endDate;
    } else {
        if (startDate) updateData.startDate = startDate;
        if (endDate) updateData.endDate = endDate;
    }
    if (alertThreshold) updateData.alertThreshold = alertThreshold;
    if (isActive !== undefined) updateData.isActive = isActive;

    console.log('Updating budget with data:', { budgetID, updateData });
    const updatedBudget = await Budget.findByIdAndUpdate(budgetID, updateData, { new: true })
        .populate('categoryID');

    if (!updatedBudget) {
        throw new Error('Budget not found');
    }

    // Calculate progress
    const progress = (updatedBudget.spent / updatedBudget.amount) * 100;
    return {
        ...updatedBudget.toObject(),
        progress,
        isOverBudget: progress > 100,
        isNearThreshold: progress >= updatedBudget.alertThreshold
    };
};

exports.getBudgetById = async (budgetID) => {
    const budget = await Budget.findById(budgetID).populate('categoryID');
    if (!budget) {
        throw new Error('Budget not found');
    }

    // Calculate progress
    const progress = (budget.spent / budget.amount) * 100;
    return {
        ...budget.toObject(),
        progress,
        isOverBudget: progress > 100,
        isNearThreshold: progress >= budget.alertThreshold
    };
};

exports.deleteBudget = async (budgetID) => {
    return await Budget.findByIdAndDelete(budgetID);
};
