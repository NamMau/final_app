const express = require('express');
const { createGoal, getUserGoals, updateGoal, deleteGoal } = require('../controllers/goal.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post("/create-goal", authMiddleware, createGoal);
router.get("/get-user-goals/:userID", authMiddleware, getUserGoals);
router.put("/update-goal/:id", authMiddleware, updateGoal);
router.delete("/delete-goal/:id", authMiddleware, deleteGoal);

module.exports = router;
