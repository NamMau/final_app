const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    period: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    alertThreshold: { type: Number, default: 80 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Budget', BudgetSchema);