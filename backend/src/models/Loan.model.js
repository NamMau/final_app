const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goalID: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
    loanName: { type: String, required: true },
    loanAmount: { type: Number, required: true },
    remainingBalance: { type: Number, required: true },
    interestRate: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    monthlyPayment: { type: Number, required: true },
    status: { type: String, enum: ['active', 'completed', 'defaulted'], default: 'active' },
    paymentSchedule: [{
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        isPaid: { type: Boolean, default: false },
        paidDate: { type: Date }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);