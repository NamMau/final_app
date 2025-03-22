const User = require("../models/User.model");
const {generateToken} = require("../utils/tokenUtils");
const bcrypt = require("bcryptjs");
console.log("Bcrypt module:", bcrypt);

exports.createUser = async (userData) => {
    const { userName, email, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    const user = new User({ userName, email, password: hashedPassword });

    await user.save();
    return user;
};

exports.getUserById = async (userId) => {
    return await User.findById(userId);
};

exports.getAllUsers = async () => {
    return await User.find({}, "-password"); // not return password
};

exports.updateUser = async (userId, updateData) => {
    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10); // Hash password if update
    }
    return await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });
};

exports.deleteUser = async (userId) => {
    return await User.findByIdAndDelete(userId);
};


exports.changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userID);
    if(!user) throw new Error("User not found");

    //Check is old password correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if(!isMatch) throw new Error("Old password is incorrect");

    //Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return {success: true, message: "Password changed successfully"};
};


