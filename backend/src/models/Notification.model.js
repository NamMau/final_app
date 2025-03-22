const mongoose = require('mongoose');

const NotificationShema = new mongoose.Schema({
    userID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    message: {type: String, required: true},
    timestamp: {type: Date, default: Date.now},
    status: {type: String, enum: ['unread', 'read'], default: 'unread'},
}, {timestamps: true});

module.exports = mongoose.model('Notification', NotificationShema);