const { verifyRefreshToken } = require("../utils/tokenUtils");
const User = require("../models/User.model");

exports.refreshTokenMiddleware = async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: "Refresh token is required!" });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findOne({
            _id: decoded.userId,
            "tokens.refreshToken": refreshToken,
            "tokens.expiresAt": { $gt: new Date() } // Check if refresh token is valid
        });

        if (!user) {
            throw new Error("Invalid or expired refresh token!");
        }

        req.user = user; // Attach user object to request
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Refresh token is invalid or expired!" });
    }
};