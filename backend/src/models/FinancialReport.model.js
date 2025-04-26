const mongoose = require('mongoose');

const FinancialReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  period: {
    type: String,
    enum: ['week', 'month', 'year'],
    required: true
  },
  categorySpending: [{
    name: String,
    amount: Number,
    color: String
  }],
  budgetStatuses: [{
    name: String,
    spent: Number,
    total: Number,
    percentage: Number
  }],
  monthlyData: {
    labels: [String],
    income: [Number],
    expenses: [Number]
  },
  insights: [String],
  recommendations: [String],
  totalIncome: Number,
  totalExpenses: Number,
  savingsRate: Number
}, {
  timestamps: true
});

module.exports = mongoose.model('FinancialReport', FinancialReportSchema);
