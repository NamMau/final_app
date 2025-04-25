const User = require("../models/User.model");
const Account = require("../models/Account.model");
const {generateAccessToken} = require("../utils/tokenUtils");
const bcrypt = require("bcryptjs");

exports.createUser = async ({
    userName,
    email,
    password,
    phoneNumber,
    address,
    fullName,
    dateOfBirth
}) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    const user = new User({
        userName,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        fullName,
        dateOfBirth
    });

    await user.save();
    const accessToken = generateAccessToken(user._id); // Generate access token
    return {user, accessToken}; // Return user and access token
};

exports.getUserById = async (userId) => {
    const user = await User.findById(userId).select("-password");
    if (!user) return null;

    // Get account information
    const account = await Account.findOne({ userId: user._id });
    
    // Combine user and account data
    const userWithAccount = user.toObject();
    if (account) {
        userWithAccount.accountId = account._id;
        userWithAccount.totalBalance = account.totalBalance;
        userWithAccount.currency = 'USD'; // Default currency
    }

    return userWithAccount;
};

exports.getUsers = async (filters = {}) => {
    const query = {};
    
    // Apply filters
    if (filters.userName) query.userName = { $regex: filters.userName, $options: 'i' };
    if (filters.email) query.email = { $regex: filters.email, $options: 'i' };
    if (filters.fullName) query.fullName = { $regex: filters.fullName, $options: 'i' };
    
    return await User.find(query).select("-password").sort({ createdAt: -1 });
};

exports.updateUser = async (userId, {
    userName,
    email,
    password,
    phoneNumber,
    address,
    fullName,
    dateOfBirth
}) => {
    const updateData = {};
    if (userName) updateData.userName = userName;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (address) updateData.address = address;
    if (fullName) updateData.fullName = fullName;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    
    if (password) {
        updateData.password = await bcrypt.hash(password, 10); // Hash password if update
    }
    if(email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userId) throw new Error("Email already exists");
    }
    
    return await User.findByIdAndUpdate(userId, updateData, {new: true, runValidators: true}).select("-password");
};

exports.deleteUser = async (userId) => {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) throw new Error("User not found");
    return await User.findByIdAndDelete(userId);
};

exports.changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId);
    if(!user) throw new Error("User not found");

    //Check is old password correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if(!isMatch) throw new Error("Old password is incorrect");

    //Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return {success: true, message: "Password changed successfully"};
};

exports.updateBalance = async (userId, { totalBalance, currency }) => {
    if (typeof totalBalance !== 'number' || totalBalance < 0) {
        throw new Error('Invalid balance amount');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Find or create account for user
    let account = await Account.findOne({ userId });
    if (!account) {
        account = new Account({
            userId,
            totalBalance: 0,
            currency: 'VND'
        });
    }

    // Update account balance
    account.totalBalance = totalBalance;
    if (currency) {
        account.currency = currency;
    }

    await account.save();

    // Return combined user and account data
    const userWithAccount = user.toObject();
    userWithAccount.totalBalance = account.totalBalance;
    userWithAccount.currency = account.currency;
    userWithAccount.accountId = account._id;

    return userWithAccount;
};
