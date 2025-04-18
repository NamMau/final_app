// controllers/notification.controller.js
const notificationService = require("../services/notification.service");

exports.createNotification = async (req, res) => {
    try {
        const { 
            userId,
            message,
            type,
            priority,
            link 
        } = req.body;
        
        const notification = await notificationService.createNotification({
            userId,
            message,
            type,
            priority,
            link
        });
        
        res.status(201).json({ success: true, data: {notification} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, status, priority } = req.query;
        const notifications = await notificationService.getUserNotifications(userId, { type, status, priority });
        res.status(200).json({ success: true, data: {notifications} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id);
        res.status(200).json({ success: true, data: {notification} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await notificationService.deleteNotification(req.params.id);
        res.status(200).json({ success: true, message: "Notification deleted successfully", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};