const Budget = require("../models/Budget.model");

exports.createBudget = async ({ userId, categoryID, name, amount, spent = 0, period, startDate, endDate, alertThreshold, isActive = true }) => {
    return await Budget.create({
        user: userId,
        category: categoryID,
        name,
        amount,
        spent,
        period,
        startDate,
        endDate,
        alertThreshold,
        isActive
    });
};

exports.getBudgets = async (userId, filters = {}) => {
    const query = { user: userId };
    // Apply filters
    if (filters.category) query.category = filters.category;
    if (filters.period) query.period = filters.period;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.startDate && filters.endDate) {
        query.startDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }
    return await Budget.find(query)
        .populate('category')
        .sort({ startDate: -1 });
};

exports.updateBudget = async (budgetID, { name, amount, spent, period, startDate, endDate, alertThreshold, isActive }) => {
    const updateData = {};
    if (name) updateData.name = name;
    if (amount) updateData.amount = amount;
    if (spent !== undefined) updateData.spent = spent;
    if (period) updateData.period = period;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (alertThreshold) updateData.alertThreshold = alertThreshold;
    if (isActive !== undefined) updateData.isActive = isActive;

    return await Budget.findByIdAndUpdate(budgetID, updateData, { new: true }).populate('category');
};

exports.deleteBudget = async (budgetID) => {
    return await Budget.findByIdAndDelete(budgetID);
};
