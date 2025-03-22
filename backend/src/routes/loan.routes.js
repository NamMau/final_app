const express = require("express");
const { createLoan, getAllLoans, getLoanById, deleteLoanById } = require("../controllers/loan.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createLoan);
router.get("/", authMiddleware, getAllLoans); 
router.get("/:id", authMiddleware, getLoanById);
router.delete("/:id", authMiddleware, deleteLoanById);

module.exports = router;
