const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goalName: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    targetDate: { type: Date, required: true },
    type: { type: String, enum: ['saving', 'debt', 'investment'], required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    description: { type: String },
    milestones: [{
        amount: { type: Number, required: true },
        date: { type: Date, required: true },
        isAchieved: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);