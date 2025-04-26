const transactionService = require('../services/transaction.service');

const transactionController = {
    async getUserTransactions(req, res) {
        try {
            if (!req.user || !req.user._id) {
                console.error('No user in request');
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const userId = req.user._id;
            console.log('User ID from request:', userId);
            console.log('Query params:', req.query);

            const transactions = await transactionService.getUserTransactions(userId, req.query);

            console.log('Transactions from service:', transactions);
            
            // Ensure we always return an array
            const responseData = Array.isArray(transactions) ? transactions : [];
            
            res.json({
                success: true,
                data: responseData
            });
        } catch (error) {
            console.error('Error in getUserTransactions:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getTransactionStats(req, res) {
        try {
            const userId = req.user._id;
            const { period } = req.query;
            const stats = await transactionService.getTransactionStats(userId, period);
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
    
    async getMonthlyStats(req, res) {
        try {
            const userId = req.user._id;
            const { period } = req.query;
            const stats = await transactionService.getMonthlyStats(userId, period);
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting monthly stats:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = transactionController;
