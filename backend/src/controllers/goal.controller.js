// controllers/goal.controller.js
const goalService = require("../services/goal.service");

exports.createGoal = async (req, res) => {
    try {
        const { 
            userID,
            goalName,
            targetAmount,
            startDate,
            targetDate,
            type,
            description,
            milestones 
        } = req.body;
        
        const goal = await goalService.createGoal({
            userID,
            goalName,
            targetAmount,
            startDate,
            targetDate,
            type,
            description,
            milestones
        });
        
        res.status(201).json({ success: true, data: {goal} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getUserGoals = async (req, res) => {
    try {
        const { userID } = req.params;
        const { type, status } = req.query;
        const goals = await goalService.getUserGoals(userID, { type, status });
        res.status(200).json({ success: true, data: {goals} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateGoal = async (req, res) => {
    try {
        const { 
            goalName,
            targetAmount,
            currentAmount,
            startDate,
            targetDate,
            type,
            status,
            description,
            milestones 
        } = req.body;
        
        const goal = await goalService.updateGoal(req.params.id, {
            goalName,
            targetAmount,
            currentAmount,
            startDate,
            targetDate,
            type,
            status,
            description,
            milestones
        });
        
        res.status(200).json({ success: true, data: {goal} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteGoal = async (req, res) => {
    try {
        await goalService.deleteGoal(req.params.id);
        res.status(200).json({ success: true, message: "Goal deleted successfully", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};