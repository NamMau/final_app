const Loan = require("../models/Loan.model");

exports.createLoan = async (userID, loanName, loanAmount, startDate, endDate, monthlyPayment, remainingBalance) => {
    return await Loan.create({ user: userID, loanName, loanAmount, startDate, endDate, monthlyPayment, remainingBalance });
};

exports.getAllLoans = async () => {
    return await Loan.find(); 
};

exports.updateLoan = async (loanID, remainingBalance) => {
    return await Loan.findByIdAndUpdate(loanID, { remainingBalance }, { new: true });
};

exports.deleteLoan = async (loanID) => {
    return await Loan.findByIdAndDelete(loanID);
};