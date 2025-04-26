const Notification = require("../models/Notification.model");

exports.createNotification = async ({
    userId,
    message,
    type,
    priority = "normal",
    link,
    status = "unread"
}) => {
    console.log('Creating notification with data:', { userId, message, type, priority, status, link });
    
    if (!userId) {
        console.error('Missing required userId for notification');
        throw new Error('userId is required for notification');
    }
    
    return await Notification.create({
        userId: userId,
        message,
        type,
        priority,
        link,
        status,
        timestamp: new Date()
    });
};

exports.getUserNotifications = async (userId, filters = {}) => {
    const query = { user: userId };
    
    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.startDate && filters.endDate) {
        query.timestamp = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    return await Notification.find(query)
        .sort({ timestamp: -1 });
};

exports.markAsRead = async (notificationID) => {
    return await Notification.findByIdAndUpdate(
        notificationID,
        { status: "read" },
        { new: true }
    );
};

exports.deleteNotification = async (notificationID) => {
    return await Notification.findByIdAndDelete(notificationID);
};
