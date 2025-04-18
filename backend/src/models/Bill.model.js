const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    billName: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['paid', 'unpaid', 'overdue'], default: 'unpaid' },
    type: { type: String, enum: ['manual', 'ocr'], default: 'manual' },
    receiptImage: { type: String },
    ocrData: { type: Object },
    location: { type: String },
    tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Bill', BillSchema);