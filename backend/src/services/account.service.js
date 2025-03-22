const Account = require("../models/Account.model");

exports.createAccount = async (userName, email, password) => {
    return await Account.create({ userName, email, password });
};

exports.getAccountById = async (accountID) => {
    return await Account.findById(accountID);
};

exports.getAllAccounts = async () => {
    return await Account.find();
};

exports.updateAccount = async (accountID, updateData) => {
    return await Account.findByIdAndUpdate(accountID, updateData, { new: true });
};

exports.deleteAccount = async (accountID) => {
    return await Account.findByIdAndDelete(accountID);
};
