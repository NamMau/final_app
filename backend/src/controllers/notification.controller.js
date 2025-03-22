// controllers/notification.controller.js
const notificationService = require("../services/notification.service");

exports.createNotification = async (req, res) => {
    try {
        const notification = await notificationService.createNotification(req.body);
        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.params.userID);
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await notificationService.markAsRead(req.params.id);
        res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await notificationService.deleteNotification(req.params.id);
        res.status(200).json({ success: true, message: "Notification deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};