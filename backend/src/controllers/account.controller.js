const accountService = require("../services/account.service");

exports.createAccount = async (req, res) => {
    try {
        const response = await accountService.createAccount(req.body);
        res.status(201).json({ success: true, data: response.data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAccountById = async (req, res) => {
    try {
        const response = await accountService.getAccountById(req.params.id);
        if (!response.data) return res.status(404).json({ success: false, message: "Account not found" });
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllAccounts = async (req, res) => {
    try {
        const response = await accountService.getAllAccounts();
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const response = await accountService.updateAccount(req.params.id, req.body);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const response = await accountService.deleteAccount(req.params.id);    
        res.status(200).json({ success: true, message: "Account deleted successfully", data: response.data});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
