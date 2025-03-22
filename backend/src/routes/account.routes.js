const express = require("express");
const {
    createAccount,
    getAccountById,
    getAllAccounts,
    updateAccount,
    deleteAccount
} = require("../controllers/account.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createAccount);
router.get("/:id", authMiddleware, getAccountById);
router.get("/", authMiddleware, getAllAccounts);
router.put("/:id", authMiddleware, updateAccount);
router.delete("/:id", authMiddleware, deleteAccount);

module.exports = router;
