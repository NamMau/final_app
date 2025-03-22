// services/auth.service.js
const User = require("../models/User.model");
const Account = require("../models/Account.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

exports.register = async (userData) => {
    const { userName, email, password, phoneNumber, address, dateOfBirth, fullName } = userData;

    // Checking if the user is already in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("User already exists");

    console.log("Password Before Hash:", password);

    // Hash password before saving in database
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Password After Hash:", hashedPassword);
    // Create new user
    const newUser = await User.create({
        userName,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        fullName,
        dateOfBirth
    });

    // Check is account has declared values?
    let newAccount;
    try {
        newAccount = await Account.create({
            userID: newUser._id,
            totalBalance: 0
        });
    } catch (error) {
        console.error("Error creating account:", error);
        throw new Error("Failed to create account");
    }

    if (!newAccount) {
        throw new Error("Account creation failed");
    }

    return { user: newUser, account: newAccount }; // Return user and account
};


exports.login = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    console.log("\n=== Login Attempt ===");
    console.log("User found:", {
        id: user._id,
        email: user.email,
        userName: user.userName
    });
    console.log("Verifying password...");

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password Match:", isMatch);

    if (!isMatch) throw new Error("Invalid credentials");

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    console.log("\nToken generated successfully!");
    console.log("Token:", token);
    console.log("===================\n");
    
    return { token, user };
};

exports.verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) throw new Error("User not found");
        return user;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};