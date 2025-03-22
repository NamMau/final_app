// controllers/auth.controller.js
const authService = require("../services/auth.service");

exports.register = async (req, res) => {
    try {
        const {user, account} = await authService.register(req.body);
        res.status(201).json({
            success: true, 
            message: "User created successfully",
            data: {user, account}
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { token, user } = await authService.login(req.body);
        console.log('\n=== Login Successful ===');
        console.log('Generated Token:', token);
        console.log('User:', {
            id: user._id,
            email: user.email,
            userName: user.userName
        });
        console.log('=====================\n');
        
        res.status(200).json({ 
            success: true, 
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    userName: user.userName,
                    fullName: user.fullName
                }
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        const user = await authService.verifyToken(req.headers.authorization);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};