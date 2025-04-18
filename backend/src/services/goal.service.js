const Goal = require('../models/Goal.model');

exports.createGoal = async ({
    userId,
    goalName,
    targetAmount,
    startDate,
    targetDate,
    type,
    description,
    milestones = [],
    currentAmount = 0,
    status = "in_progress"
}) => {
    return await Goal.create({
        user: userId,
        goalName,
        targetAmount,
        startDate,
        targetDate,
        type,
        description,
        milestones,
        currentAmount,
        status
    });
};

exports.getUserGoals = async (userId, filters = {}) => {
    const query = { user: userId };
    
    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.startDate && filters.endDate) {
        query.targetDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    return await Goal.find(query)
        .sort({ targetDate: 1 });
};

exports.updateGoal = async (goalID, {
    goalName,
    targetAmount,
    startDate,
    targetDate,
    type,
    description,
    milestones,
    currentAmount,
    status
}) => {
    const updateData = {};
    if (goalName) updateData.goalName = goalName;
    if (targetAmount) updateData.targetAmount = targetAmount;
    if (startDate) updateData.startDate = startDate;
    if (targetDate) updateData.targetDate = targetDate;
    if (type) updateData.type = type;
    if (description) updateData.description = description;
    if (milestones) updateData.milestones = milestones;
    if (currentAmount !== undefined) updateData.currentAmount = currentAmount;
    if (status) updateData.status = status;

    return await Goal.findByIdAndUpdate(goalID, updateData, { new: true });
};

exports.deleteGoal = async (goalID) => {
    return await Goal.findByIdAndDelete(goalID);
};