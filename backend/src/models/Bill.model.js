const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    budget: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
    billName: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['paid', 'unpaid', 'overdue'], default: 'unpaid' },
    type: { type: String, enum: ['manual', 'ocr'], default: 'manual' },
    receiptImage: { type: String },
    ocrData: { type: Object },
    location: { type: String },
}, { timestamps: true });

// Middleware để tự động cập nhật budget.spent khi bill được tạo hoặc cập nhật
BillSchema.pre('save', async function(next) {
    try {
        if (this.isModified('status') && this.status === 'paid') {
            const Budget = mongoose.model('Budget');
            const budget = await Budget.findById(this.budget);
            if (budget) {
                budget.spent += this.amount;
                await budget.save();
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware để kiểm tra budget trước khi lưu
BillSchema.pre('save', async function(next) {
    try {
        // Skip budget check if forceCreate flag is set
        if (this._forceCreate) {
            console.log('Force creating bill, skipping budget threshold check');
            return next();
        }

        if (this.isModified('amount') || this.isModified('budget')) {
            const Budget = mongoose.model('Budget');
            const budget = await Budget.findById(this.budget);
            if (!budget) {
                throw new Error('Budget not found');
            }

            // Calculate new total and check threshold
            const newTotal = budget.spent + this.amount;
            const percentage = (newTotal / budget.amount) * 100;

            console.log('Budget check in middleware:', {
                billAmount: this.amount,
                currentSpent: budget.spent,
                newTotal,
                budgetAmount: budget.amount,
                threshold: budget.alertThreshold,
                percentage
            });

            // Chỉ chặn khi amount vượt quá budget amount
            if (newTotal > budget.amount) {
                const error = new Error(`Budget exceeded. This bill will exceed your total budget amount (${budget.amount})`);
                error.name = 'BudgetError';
                error.budgetDetails = {
                    billAmount: this.amount,
                    currentSpent: budget.spent,
                    newTotal,
                    budgetAmount: budget.amount,
                    threshold: budget.alertThreshold,
                    percentage
                };
                throw error;
            }
            
            // Nếu chỉ vượt ngưỡng cảnh báo thì log nhưng vẫn cho tạo
            if (percentage >= budget.alertThreshold) {
                console.log(`Warning: Budget threshold of ${budget.alertThreshold}% exceeded. Current: ${percentage.toFixed(1)}%`);
            }
        }
        next();
    } catch (error) {
        console.error('Error in bill pre-save middleware:', error);
        next(error);
    }
});

module.exports = mongoose.model('Bill', BillSchema);