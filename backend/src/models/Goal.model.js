const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    userID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    goalName: {type: String, required: true},
    targetAmount: {type: Number, required: true},
    targetDate: {type: Date, required: true},
    currentAmount: {type: Number, default: 0},
}, {timestamps: true});

module.exports = mongoose.model('Goal', GoalSchema);