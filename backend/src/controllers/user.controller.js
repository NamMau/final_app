// controllers/user.controller.js
const userService = require("../services/user.service");

exports.createUser = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json({ success: true, data: {user} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found", data: null });
        res.status(200).json({ success: true, data: {user} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUserById = async (req, res) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body);
        res.status(200).json({ success: true, data: {updatedUser} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteUserById = async (req, res) => {
    try {
        await userService.deleteUser(req.params.id);
        res.status(200).json({ success: true, message: "User deleted successfully", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({ success: true, data: {users} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;
        const updatedUser = await userService.updateAvatar(req.params.id, avatar);
        res.status(200).json({ success: true, data: {updatedUser} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedUser = await userService.updateStatus(req.params.id, status);
        res.status(200).json({ success: true, data: {updatedUser} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const {oldPassword, newPassword} = req.body;
        const userID = req.params.id;

        const result = await userService.changePassword(userID, oldPassword, newPassword);
        res.status(200).json({success: true,data: {result}});
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
