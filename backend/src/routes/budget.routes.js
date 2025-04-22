const express = require("express");
const { 
    createBudget, 
    getBudgets,
    getBudgetById, 
    updateBudget, 
    deleteBudget 
} = require("../controllers/budget.controller");  

const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// Create a new budget
router.post("/", authMiddleware, createBudget);

// Get all budgets for authenticated user with optional filters
router.get("/", authMiddleware, getBudgets);

// Get a specific budget by ID
router.get("/:id", authMiddleware, getBudgetById); 

// Update a budget
router.put("/:id", authMiddleware, updateBudget);

// Delete a budget
router.delete("/:id", authMiddleware, deleteBudget);

module.exports = router;
