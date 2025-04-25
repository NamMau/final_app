const Transaction = require('../models/Transaction.model');
const { ObjectId } = require('mongoose').Types;
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
            const userObjectId = new ObjectId(userId);
            let startDate = new Date();
            let endDate = new Date(); // Current date

            // Calculate start date based on period
            if (period === 'week') {
                // Set start date to 7 days ago from current date
                startDate.setDate(endDate.getDate() - 6);
            } else if (period === 'month') {
                startDate.setMonth(startDate.getMonth() - 1);
            } else if (period === 'year') {
                startDate.setFullYear(startDate.getFullYear() - 1);
            }
            
            // Reset hours to get full days
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            // Generate array of all dates in range
            const getDatesInRange = (startDate, endDate) => {
                const dates = [];
                const currentDate = new Date(startDate);
                
                while (currentDate <= endDate) {
                    dates.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                
                return dates;
            };

            const stats = await Transaction.aggregate([
                {
                    $match: {
                        user: userObjectId,
                        date: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: {
                                $dateToString: {
                                    format: period === 'week' ? '%Y-%m-%d' : '%Y-%m',
                                    date: '$date'
                                }
                            }
                        },
                        total: { $sum: '$amount' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        date: '$_id.date',
                        total: 1
                    }
                },
                {
                    $sort: {
                        date: 1
                    }
                },
                {
                    $sort: { date: 1 }
                }
            ]);

            // Get all dates in range
            const allDates = getDatesInRange(startDate, endDate);
            
            // Create a map of existing totals
            const totalsMap = stats.reduce((acc, stat) => {
                acc[stat.date] = stat.total;
                return acc;
            }, {});

            // Fill in missing dates with 0
            const completeStats = allDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                return {
                    date: dateStr,
                    total: totalsMap[dateStr] || 0
                };
            });

            return completeStats;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = transactionService;
