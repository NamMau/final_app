const Loan = require("../models/Loan.model");

exports.createLoan = async ({
    userId,
    goalID,
    loanName,
    loanAmount,
    interestRate,
    startDate,
    endDate,
    monthlyPayment,
    paymentSchedule = [],
    remainingBalance,
    status = "active"
}) => {
    return await Loan.create({
        user: userId,
        goal: goalID,
        loanName,
        loanAmount,
        interestRate,
        startDate,
        endDate,
        monthlyPayment,
        paymentSchedule,
        remainingBalance,
        status
    });
};

exports.getUserLoans = async (userId, filters = {}) => {
    const query = { user: userId };
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.goal) query.goal = filters.goal;
    if (filters.startDate && filters.endDate) {
        query.startDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    return await Loan.find(query)
        .populate('goal')
        .sort({ startDate: -1 });
};

exports.updateLoan = async (loanID, {
    loanName,
    loanAmount,
    interestRate,
    startDate,
    endDate,
    monthlyPayment,
    paymentSchedule,
    remainingBalance,
    status
}) => {
    const updateData = {};
    if (loanName) updateData.loanName = loanName;
    if (loanAmount) updateData.loanAmount = loanAmount;
    if (interestRate) updateData.interestRate = interestRate;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (monthlyPayment) updateData.monthlyPayment = monthlyPayment;
    if (paymentSchedule) updateData.paymentSchedule = paymentSchedule;
    if (remainingBalance !== undefined) updateData.remainingBalance = remainingBalance;
    if (status) updateData.status = status;

    return await Loan.findByIdAndUpdate(loanID, updateData, { new: true }).populate('goal');
};

exports.deleteLoan = async (loanID) => {
    return await Loan.findByIdAndDelete(loanID);
};