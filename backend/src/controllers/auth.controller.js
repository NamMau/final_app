const authService = require("../services/auth.service");
// Remove logger import if not used extensively
const logger = require("winston"); // Optional: keep it if you actively log errors elsewhere

// Register a new user
exports.register = async (req, res) => {
    try {
        const { user, account, token } = await authService.register(req.body);
        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: { user, account, token }
        });
    } catch (error) {
        logger.error("Register error: ", error.message); // Optional: remove if logging isn't consistent
        res.status(400).json({ success: false, message: error.message });
    }
};

// User login
exports.login = async (req, res) => {
    try {
        console.log('\n=== Login Controller ===');
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);

        const { accessToken, refreshToken, user, account } = await authService.login(req.body);
        console.log("\n=== Login Successful ===");
        console.log("Generated Access Token:", accessToken);
        console.log("Generated Refresh Token:", refreshToken);
        console.log("User:", user);
        console.log("========================\n");

        res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user,
                account
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ success: false, message: error.message });
    }
};

// Refresh access token
exports.refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const { accessToken, newRefreshToken } = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// Logout
exports.logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "Missing authorization token" });
        }

        const token = authHeader.split(" ")[1]; // Fix typo (autherHeader -> authHeader)
        await authService.logout(token);

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
            data: null // Ensure consistency in response structure
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verify token validity
exports.verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Authorization token is missing or invalid" });
        }

        const token = authHeader.split(" ")[1];
        const user = await authService.verifyToken(token);

        res.status(200).json({ success: true, data: { user } });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};