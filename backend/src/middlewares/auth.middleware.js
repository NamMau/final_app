const { verifyToken } = require("../utils/tokenUtils");

exports.authMiddleware = async (req, res, next) => {
    const authHeader = req.header("Authorization"); // Lấy token từ headers
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied" });
    }

    const token = authHeader.split(" ")[1]; // Lấy phần token sau "Bearer "
    try {
        const decoded = await verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid Token" });
    }
};
