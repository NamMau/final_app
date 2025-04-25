const { verifyAccessToken } = require("../utils/tokenUtils");

exports.authMiddleware = async (req, res, next) => {
    console.log('=== Auth Middleware ===');
    console.log('Request path:', req.path);
    console.log('Request headers:', req.headers);
    
    const publicRoutes = [
        //'/auth/login',
        '/auth/register'
    ];
    if (publicRoutes.includes(req.path)) {
        console.log('Public route, skipping auth');
        return next();
    }

    const authHeader = req.header("Authorization");
    console.log('Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log('No valid auth header found');
        return res.status(401).json({ success: false, message: "Access Denied: Access token is required!" });
    }

    const accessToken = authHeader.split(" ")[1];
    console.log('Access token:', accessToken);
    
    try {
        const decoded = verifyAccessToken(accessToken);
        console.log('Decoded token:', decoded);
        
        // Set both _id and id for compatibility
        req.user = { 
            _id: decoded.userId,
            id: decoded.userId 
        };
        console.log('Set user:', req.user);
        
        next();
    } catch (error) {
        console.log('Token verification error:', error);
        res.status(401).json({ success: false, message: "Access token is invalid or expired!" });
    }
};