const express = require("express");
const { 
    createBill, 
    getBillById, 
    getBills, 
    updateBillById, 
    deleteBillById, 
    deleteBills 
} = require("../controllers/bill.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createBill);
router.get("/", authMiddleware, getBills);
router.get("/:id", authMiddleware, getBillById);
router.put("/:id", authMiddleware, updateBillById);
router.delete("/:id", authMiddleware, deleteBillById);
router.delete("/", authMiddleware, deleteBills);

module.exports = router;
