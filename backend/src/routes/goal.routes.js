const express = require('express');
const { createGoal, getAllGoals, completeGoal, deleteGoal } = require('../controllers/goal.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post("/", authMiddleware, createGoal);
router.get("/", authMiddleware, getAllGoals); 
router.put("/:id/complete", authMiddleware, completeGoal);
router.delete("/:id", authMiddleware, deleteGoal); 

module.exports = router;
