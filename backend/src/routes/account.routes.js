const express = require("express");
const {
    createAccount,
    getAccountById,
    getAllAccounts,
    updateAccount,
    deleteAccount,
    addAccountHistory
} = require("../controllers/account.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/create-account", authMiddleware, createAccount);
router.get("/get-account-by-id/:id", authMiddleware, getAccountById);
router.get("/get-all-accounts", authMiddleware, getAllAccounts);
router.put("/update-account/:id", authMiddleware, updateAccount);
router.delete("/delete-account/:id", authMiddleware, deleteAccount);
router.post("/add-history", authMiddleware, addAccountHistory);


module.exports = router;
