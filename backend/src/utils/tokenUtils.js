const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

console.log('=== Token Utils ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);

// Generate an access token
exports.generateAccessToken = (userId) => {
    console.log('Generating access token for user:', userId);
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Generate a refresh token
exports.generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
};

// Verify an access token
exports.verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify a refresh token
exports.verifyRefreshToken = (refreshToken) => {
    return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
};