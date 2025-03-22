const Budget = require("../models/Budget.model");

exports.createBudget = async (userID, categoryID, amount, startDate, endDate) => {
    return await Budget.create({ user: userID, category: categoryID, amount, startDate, endDate });
};

exports.getBudgets = async (userID) => {
    return await Budget.find({user: userID});
};

exports.updateBudget = async (budgetID, amount, startDate, endDate) => {
    return await Budget.findByIdAndUpdate(budgetID, {amount, startDate, endDate }, {new: true});
};

exports.deleteBudget = async (budgetID) => {
    return await Budget.findByIdAndDelete(budgetID);
};
