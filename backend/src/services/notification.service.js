const Notification = require("../models/Notification.model");

exports.createNotification = async (userID, message) => {
    return await Notification.create({ user: userID, message, timestamp: new Date(), status: "unread" });
};

exports.getUserNotifications = async (userID) => {
    return await Notification.find({ user: userID }).sort({ timestamp: -1 });
};


exports.markAsRead = async (notificationID) => {
    return await Notification.findByIdAndUpdate(notificationID, { status: "read" }, { new: true });
};


exports.deleteNotification = async (notificationID) => {
    return await Notification.findByIdAndDelete(notificationID);
};
