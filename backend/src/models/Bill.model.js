const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    userID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    billName: {type: String, required: true},
    amount: {type: Number, required: true},
    dueDate : {type: Date, required: true},
    status: {type: String, enum: ['paid', 'unpaid'], default: 'unpaid'},
});

module.exports = mongoose.model('Bill', BillSchema);