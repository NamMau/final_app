const Account = require("../models/Account.model");

// exports.createAccount = async ({
//     userID,
//     accountName,
//     accountType,
//     balance = 0,
//     currency = "VND",
//     description,
//     isActive = true
// }) => {
//     return await Account.create({
//         user: userID,
//         accountName,
//         accountType,
//         balance,
//         currency,
//         description,
//         isActive
//     });
// };
exports.createDefaultAccount = async (userId) => {
    return await Account.create({
        userId,
        totalBalance: 0,
        isActive: true
    });
};

// exports.getAccounts = async (userID, filters = {}) => {
//     const query = { user: userID };
    
//     // Apply filters
//     if (filters.accountType) query.accountType = filters.accountType;
//     if (filters.isActive !== undefined) query.isActive = filters.isActive;
//     if (filters.accountName) {
//         query.accountName = { $regex: filters.accountName, $options: 'i' };
//     }

//     return await Account.find(query).sort({ accountName: 1 });
// };
exports.getAccounts = async (userId, filters = {}) => {
    const query = { userId };

    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }

    return await Account.find(query).sort({ createdAt: -1 });
};

// exports.getAccountById = async (accountID) => {
//     return await Account.findById(accountID);
// };
exports.getAccountById = async (accountID) => {
    return await Account.findById(accountID);
};

// exports.updateAccount = async (accountID, {
//     accountName,
//     accountType,
//     balance,
//     currency,
//     description,
//     isActive
// }) => {
//     const updateData = {};
//     if (accountName) updateData.accountName = accountName;
//     if (accountType) updateData.accountType = accountType;
//     if (balance !== undefined) updateData.balance = balance;
//     if (currency) updateData.currency = currency;
//     if (description) updateData.description = description;
//     if (isActive !== undefined) updateData.isActive = isActive;

//     return await Account.findByIdAndUpdate(accountID, updateData, { new: true });
// };
exports.updateAccount = async (accountId, { totalBalance, isActive }) => {
    const updateData = {};
    if (totalBalance !== undefined) updateData.totalBalance = totalBalance;
    if (isActive !== undefined) updateData.isActive = isActive;

    return await Account.findByIdAndUpdate(accountId, updateData, { new: true });
};

exports.deleteAccount = async (accountId) => {
    return await Account.findByIdAndDelete(accountId);
};

exports.addAccountHistory = async (payload) => {
    const history = new AccountHistory(payload);
    await history.save();
    return history;
};
