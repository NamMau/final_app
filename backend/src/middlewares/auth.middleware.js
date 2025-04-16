const { verifyAccessToken } = require("../utils/tokenUtils");

exports.authMiddleware = async (req, res, next) => {
    const publicRoutes = [
        '/auth/login',
        '/auth/register'
    ];
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Access Denied: Access token is required!" });
    }

    const accessToken = authHeader.split(" ")[1];
    try {
        req.user = verifyAccessToken(accessToken); // Attach decoded token to `req.user`
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Access token is invalid or expired!" });
    }
};