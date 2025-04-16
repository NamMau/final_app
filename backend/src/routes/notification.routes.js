const express = require("express");
const { createNotification, getUserNotifications, deleteNotification, markAsRead } = require("../controllers/notification.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/create-notification", authMiddleware, createNotification);
router.get("/get-user-notifications/:userID", authMiddleware, getUserNotifications);
router.put("/mark-as-read/:id", authMiddleware, markAsRead);
router.delete("/delete-notification/:id", authMiddleware, deleteNotification); 

module.exports = router;
