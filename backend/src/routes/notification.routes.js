const express = require("express");
const { createNotification, getUserNotifications, deleteNotification, markAsRead } = require("../controllers/notification.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createNotification);
router.get("/", authMiddleware, getUserNotifications);
router.put("/:id/read", authMiddleware, markAsRead);
router.delete("/:id", authMiddleware, deleteNotification); 

module.exports = router;
