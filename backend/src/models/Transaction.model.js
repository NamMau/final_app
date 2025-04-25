const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['bill_payment'], default: 'bill_payment' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    balanceAfter: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
