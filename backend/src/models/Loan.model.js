const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    userID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    loanName: {type: String, required: true},
    loanAmount: {type: Number, required: true},
    startDate: {type: Date, required: true},
    endDate: {type: Date},
    monthlyPayment: {type: Number, required: true},
    remainingBalance: {type: Number, required: true},
}, {timestamps: true});

module.exports = mongoose.model('Loan', LoanSchema);