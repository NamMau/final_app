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

router.post("/", authMiddleware, createBudget);
router.get("/", authMiddleware, getAllBudgets);
router.get("/:id", authMiddleware, getBudgetById); 
router.put("/:id", authMiddleware, updateBudgetById);
router.delete("/:id", authMiddleware, deleteBudgetById);

module.exports = router;
