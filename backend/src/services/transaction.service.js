const Transaction = require('../models/Transaction.model');
const mongoose = require('mongoose');
const User = require('../models/User.model');

const transactionService = {
    async createTransaction(transactionData) {
        try {
            // Get user's current balance
            const user = await User.findById(transactionData.user);
            if (!user) {
                throw new Error('User not found');
            }

            // Ensure user.balance exists and is a number
            const currentBalance = typeof user.balance === 'number' ? user.balance : 0;
            
            // Calculate new balance
            const newBalance = currentBalance - (transactionData.amount || 0);
            
            // Update transaction data with new balance
            transactionData.balanceAfter = newBalance;

            // Create and save transaction
            const transaction = new Transaction(transactionData);
            await transaction.save();

            // Update user's balance
            user.balance = newBalance;
            await user.save();

            return transaction;
        } catch (error) {
            throw error;
        }
    },

    async getUserTransactions(userId, filters = {}) {
        try {
            if (!userId) {
                console.error('No userId provided');
                return [];
            }

            console.log('Getting transactions for user:', userId);
            console.log('With filters:', filters);

            const query = { user: userId };
            
            // Handle date filters
            if (filters.startDate || filters.endDate) {
                query.date = {};
                if (filters.startDate) {
                    query.date.$gte = new Date(filters.startDate);
                }
                if (filters.endDate) {
                    query.date.$lte = new Date(filters.endDate);
                }
            }

            // Handle other filters
            if (filters.category) {
                query.category = filters.category;
            }
            if (filters.type) {
                query.type = filters.type;
            }

            console.log('Transaction query:', JSON.stringify(query));

            let transactions = [];
            try {
                transactions = await Transaction.find(query)
                    .populate('bill', 'billName')
                    .populate('category', 'categoryName color')
                    .sort({ date: -1 });
            } catch (findError) {
                console.error('Error finding transactions:', findError);
                return [];
            }

            if (!Array.isArray(transactions)) {
                console.error('Mongoose returned non-array result:', transactions);
                return [];
            }

            console.log('Found transactions:', JSON.stringify(transactions));
            console.log('Number of transactions:', transactions.length);

            return transactions;
        } catch (error) {
            throw error;
        }
    },

    async getTransactionStats(userId, period = 'week') {
        try {
            if (!userId) {
                console.error('No userId provided');
                return [];
            }

            const today = new Date();
            let startDate;

            switch (period) {
                case 'week':
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    break;
                case 'month':
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case 'year':
                    startDate = new Date(today);
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
                default:
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
            }

            const pipeline = [
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        date: { $gte: startDate, $lte: today }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'categoryDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$categoryDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                            category: '$categoryDetails.categoryName'
                        },
                        total: { $sum: '$amount' },
                        categoryColor: { $first: '$categoryDetails.color' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id.date',
                        category: '$_id.category',
                        categoryColor: '$categoryColor',
                        total: '$total'
                    }
                },
                {
                    $sort: { date: 1 }
                }
            ];

            const stats = await Transaction.aggregate(pipeline);
            
            // If no stats found, return empty array
            if (!stats || stats.length === 0) {
                return [];
            }

            // Format the stats to include missing dates
            const formattedStats = [];
            const dateMap = new Map();

            // Get all unique dates in the range
            let currentDate = new Date(startDate);
            while (currentDate <= today) {
                const dateStr = currentDate.toISOString().split('T')[0];
                dateMap.set(dateStr, []);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Group stats by date
            stats.forEach(stat => {
                const dateStats = dateMap.get(stat.date) || [];
                dateStats.push(stat);
                dateMap.set(stat.date, dateStats);
            });

            // Create formatted stats with all dates
            dateMap.forEach((dateStats, date) => {
                formattedStats.push({
                    date,
                    total: dateStats.reduce((sum, stat) => sum + stat.total, 0)
                });
            });

            return formattedStats.sort((a, b) => new Date(a.date) - new Date(b.date));
        } catch (error) {
            console.error('Error getting transaction stats:', error);
            return [];
        }
    },
    
    async getMonthlyStats(userId, period = 'month') {
        try {
            if (!userId) {
                console.error('No userId provided for monthly stats');
                return [];
            }

            const today = new Date();
            let startDate;
            let groupByFormat;

            switch (period) {
                case 'week':
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    groupByFormat = '%Y-%m-%d'; // Daily for week
                    break;
                case 'month':
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    groupByFormat = '%Y-%m-%d'; // Daily for month
                    break;
                case 'year':
                    startDate = new Date(today);
                    startDate.setFullYear(today.getFullYear() - 1);
                    groupByFormat = '%Y-%m'; // Monthly for year
                    break;
                default:
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 1);
                    groupByFormat = '%Y-%m-%d';
            }

            // Get user's balance for income data
            const user = await User.findById(userId);
            const userBalance = user ? (user.totalBalance || 0) : 0;

            // Get transactions for expenses
            const pipeline = [
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        date: { $gte: startDate, $lte: today }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'categoryDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$categoryDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: groupByFormat, date: '$date' } },
                            type: '$categoryDetails.type'
                        },
                        total: { $sum: '$amount' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id.date',
                        type: '$_id.type',
                        total: '$total'
                    }
                },
                {
                    $sort: { date: 1 }
                }
            ];

            const transactions = await Transaction.aggregate(pipeline);
            
            // Format the data for the chart
            const dateMap = new Map();

            // Get all unique dates in the range
            let currentDate = new Date(startDate);
            while (currentDate <= today) {
                let dateStr;
                if (period === 'year') {
                    dateStr = currentDate.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
                    // Move to next month for year period
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else {
                    dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    // Move to next day for week/month period
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                dateMap.set(dateStr, {
                    date: dateStr,
                    income: period === 'year' ? userBalance / 12 : userBalance / 30, // Distribute income evenly
                    expenses: 0
                });
            }

            // Add transaction data
            transactions.forEach(transaction => {
                if (!dateMap.has(transaction.date)) return;
                
                const entry = dateMap.get(transaction.date);
                
                if (transaction.type === 'income') {
                    entry.income += transaction.total;
                } else {
                    entry.expenses += transaction.total;
                }
                
                dateMap.set(transaction.date, entry);
            });

            // Convert to array and sort by date
            const result = Array.from(dateMap.values())
                .sort((a, b) => a.date.localeCompare(b.date));

            return result;
        } catch (error) {
            console.error('Error getting monthly stats:', error);
            return [];
        }
    }
}

module.exports = transactionService;
