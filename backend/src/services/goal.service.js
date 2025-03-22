const Goal = require('../models/Goal.model');

exports.createGoal = async (userID, goalName, targetAmount, targetDate, currentAmount = 0) => {
    return await Goal.create({ user: userID, goalName, targetAmount, targetDate, currentAmount });
};

exports.getAllGoals = async (userID) => {
    return await Goal.find({ user: userID });
};

exports.updateGoal = async (goalID, currentAmount) => {
    return await Goal.findByIdAndUpdate(goalID, { currentAmount }, { new: true });
};

exports.deleteGoal = async (goalID) => {
    return await Goal.findByIdAndDelete(goalID);
};