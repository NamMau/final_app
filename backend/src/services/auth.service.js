const User = require("../models/User.model");
const Account = require("../models/Account.model");
const bcrypt = require("bcryptjs");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/tokenUtils");

// Register a new user
exports.register = async (userData) => {
    const { userName, email, password, phoneNumber, address, dateOfBirth, fullName } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("User already exists");

    const passwordStrength = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordStrength.test(password)) {
        throw new Error("Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
        userName,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        fullName,
        dateOfBirth
    });

    const newAccount = await Account.create({
        userID: newUser._id,
        totalBalance: 0
    });

    const token = generateAccessToken(newUser._id);

    await User.findByIdAndUpdate(newUser._id, {
        $push: {
            tokens: {
                token,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
        }
    });

    return { token, user: newUser, account: newAccount };
};

// User login
exports.login = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const account = await Account.findOne({ userID: user._id });
    if (!account) throw new Error("Account not found");

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
        $push: {
            tokens: {
                refreshToken,
                accessToken,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            }
        }
    });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            email: user.email,
            userName: user.userName,
            fullName: user.fullName,
            avatar: user.avatar
        },
        account
    };
};

// Refresh access token
exports.refreshAccessToken = async (refreshToken) => {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findOne({
        _id: decoded.userId,
        "tokens.refreshToken": refreshToken,
        "tokens.expiresAt": { $gt: new Date() }
    });

    if (!user) throw new Error("Invalid or expired refresh token");

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
        $push: {
            tokens: {
                refreshToken: newRefreshToken,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        }
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};