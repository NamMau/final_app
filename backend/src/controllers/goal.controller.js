// controllers/goal.controller.js
const goalService = require("../services/goal.service");

exports.createGoal = async (req, res) => {
    try {
        const goal = await goalService.createGoal(req.body);
        res.status(201).json({ success: true, data: goal });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllGoals = async (req, res) => {
    try {
        const goals = await goalService.getAllGoals();
        res.status(200).json({ success: true, data: goals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.completeGoal = async (req, res) => {
    try {
        const goal = await goalService.updateGoal(req.params.id, req.body.currentAmount);
        res.status(200).json({ success: true, data: goal });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteGoal = async (req, res) => {
    try {
        await goalService.deleteGoal(req.params.id);
        res.status(200).json({ success: true, message: "Goal deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};