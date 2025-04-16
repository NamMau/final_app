const express = require("express");
const { createLoan, getUserLoans, updateLoan, deleteLoan } = require("../controllers/loan.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/create-loan", authMiddleware, createLoan);
router.get("/get-user-loans/:userID", authMiddleware, getUserLoans);
router.put("/update-loan/:id", authMiddleware, updateLoan);
router.delete("/delete-loan/:id", authMiddleware, deleteLoan);

module.exports = router;
