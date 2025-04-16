const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['budget_alert', 'bill_due', 'goal_achieved', 'loan_payment', 'system'], required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['read', 'unread'], default: 'unread' },
    link: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);