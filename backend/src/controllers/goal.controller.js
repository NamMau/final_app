// controllers/goal.controller.js
const goalService = require("../services/goal.service");

exports.createGoal = async (req, res) => {
    try {
        const { 
            userId,
            goalName,
            targetAmount,
            startDate,
            targetDate,
            type,
            description,
            milestones 
        } = req.body;
        
        const goal = await goalService.createGoal({
            userId,
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
        const { userId } = req.params;
        const { type, status } = req.query;
        const goals = await goalService.getUserGoals(userId, { type, status });
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

// Create a financial goal with automatic milestone generation
exports.createFinancialGoal = async (req, res) => {
    try {
        const { 
            userId,
            goalName,
            targetAmount,
            startDate,
            targetDate,
            type,
            description,
            initialAmount
        } = req.body;
        
        const goal = await goalService.createFinancialGoal({
            userId,
            goalName,
            targetAmount,
            startDate,
            targetDate,
            type,
            description,
            initialAmount
        });
        
        res.status(201).json({ 
            success: true, 
            message: "Financial goal created with milestones",
            data: { goal } 
        });
    } catch (error) {
        console.error('Error creating financial goal:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update goal progress
exports.updateGoalProgress = async (req, res) => {
    try {
        const { goalId } = req.params;
        const { 
            currentAmount,
            milestoneIndex,
            isAchieved
        } = req.body;
        
        const goal = await goalService.updateGoalProgress(goalId, {
            currentAmount,
            milestoneIndex,
            isAchieved
        });
        
        res.status(200).json({ 
            success: true, 
            message: "Goal progress updated",
            data: { goal } 
        });
    } catch (error) {
        console.error('Error updating goal progress:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Check and update milestone achievements
exports.checkMilestones = async (req, res) => {
    try {
        const { goalId } = req.params;
        
        const goal = await goalService.checkMilestones(goalId);
        
        res.status(200).json({ 
            success: true, 
            message: "Milestones checked",
            data: { goal } 
        });
    } catch (error) {
        console.error('Error checking milestones:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get goal details with progress
exports.getGoalDetails = async (req, res) => {
    try {
        const { goalId } = req.params;
        
        const goal = await goalService.getGoalById(goalId);
        if (!goal) {
            return res.status(404).json({ success: false, message: "Goal not found" });
        }
        
        // Calculate progress percentage
        const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
        
        // Calculate days remaining - sửa cách tính để chính xác hơn
        const today = new Date();
        const targetDate = new Date(goal.targetDate);
        
        // Nếu targetDate đã qua, days remaining = 0
        const daysRemaining = targetDate > today 
            ? Math.max(0, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)))
            : 0;
        
        // Get upcoming milestones
        const upcomingMilestones = goal.milestones
            .filter(milestone => !milestone.isAchieved)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        res.status(200).json({ 
            success: true, 
            data: {
                goal,
                progressPercentage,
                daysRemaining,
                upcomingMilestones: upcomingMilestones.slice(0, 3) // Return next 3 milestones
            } 
        });
    } catch (error) {
        console.error('Error getting goal details:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};