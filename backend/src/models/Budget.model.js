const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
    userID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    categoryID: {type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true},
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    amount: {type: Number, required: true},
}, {timestamps: true});

module.exports = mongoose.model('Budget', BudgetSchema);