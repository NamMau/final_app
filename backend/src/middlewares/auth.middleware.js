const { verifyToken } = require("../utils/tokenUtils");

// List of routes that don't require token verification
const publicRoutes = [
    '/auth/login',
    '/auth/register'
];

exports.authMiddleware = async (req, res, next) => {
    // Skip token verification for public routes
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = await verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid Token" });
    }
};
