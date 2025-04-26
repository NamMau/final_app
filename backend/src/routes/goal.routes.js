const express = require('express');
const { 
    createGoal, 
    getUserGoals, 
    updateGoal, 
    deleteGoal,
    createFinancialGoal,
    updateGoalProgress,
    checkMilestones,
    getGoalDetails
} = require('../controllers/goal.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Basic goal operations
router.post("/create-goal", authMiddleware, createGoal);
router.get("/get-user-goals/:userId", authMiddleware, getUserGoals);
router.put("/update-goal/:id", authMiddleware, updateGoal);
router.delete("/delete-goal/:id", authMiddleware, deleteGoal);

// Advanced goal operations
router.post("/create-financial-goal", authMiddleware, createFinancialGoal);
router.put("/update-progress/:goalId", authMiddleware, updateGoalProgress);
router.get("/check-milestones/:goalId", authMiddleware, checkMilestones);
router.get("/details/:goalId", authMiddleware, getGoalDetails);

module.exports = router;
