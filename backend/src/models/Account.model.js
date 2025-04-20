const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  totalBalance: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true },
  history: [{
    changeType: {
      type: String,
      enum: [
        'bill_add', 'bill_update', 'bill_delete',
        'loan_add', 'loan_payment', 'loan_update', 'loan_delete',
        'budget_add', 'budget_update', 'budget_delete'
      ],
      required: true
    },
    modelType: { type: String, enum: ['Bill', 'Loan', 'Budget'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, 
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Account", AccountSchema);
