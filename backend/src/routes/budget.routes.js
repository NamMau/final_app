const express = require("express");
const { 
    createBudget, 
    getAllBudgets, 
    getBudgetById, 
    updateBudgetById, 
    deleteBudgetById 
} = require("../controllers/budget.controller");  

const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/create-budget", authMiddleware, createBudget);
router.get("/get-all-budgets", authMiddleware, getAllBudgets);
router.get("/get-budget-by-id/:id", authMiddleware, getBudgetById); 
router.put("/update-budget-by-id/:id", authMiddleware, updateBudgetById);
router.delete("/delete-budget-by-id/:id", authMiddleware, deleteBudgetById);

module.exports = router;
