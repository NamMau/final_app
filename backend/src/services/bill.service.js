const Bill = require('../models/Bill.model');
const Budget = require('../models/Budget.model');
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const transactionService = require('./transaction.service');

// Helper function to parse bill text
const parseBillText = (text) => {
    // Split text into lines
    const lines = text.split('\n');
    
    // Initialize result object
    const result = {
        date: new Date(),
        total: 0,
        items: []
    };

    // Regular expressions for matching
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;
    const itemRegex = /^(.+?)\s+(\d+)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)$/;
    const totalRegex = /TỔNG CỘNG\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;

    // Process each line
    lines.forEach(line => {
        line = line.trim();
        
        // Try to match date
        const dateMatch = line.match(dateRegex);
        if (dateMatch) {
            result.date = new Date(dateMatch[1]);
        }
        
        // Try to match items
        const itemMatch = line.match(itemRegex);
        if (itemMatch) {
            result.items.push({
                name: itemMatch[1].trim(),
                quantity: parseInt(itemMatch[2]),
                price: parseFloat(itemMatch[3].replace(/,/g, ''))
            });
        }
        
        // Try to match total
        const totalMatch = line.match(totalRegex);
        if (totalMatch) {
            result.total = parseFloat(totalMatch[1].replace(/,/g, ''));
        }
    });

    return result;
};

const createBill = async ({ userId, billName, amount, dueDate, budget, description, type, location, status = "unpaid", forceCreate = false }) => {
    try {
        console.log('Creating bill with data:', { userId, billName, amount, dueDate, budget, description, type, location, status });

        // Create bill
        const billData = {
            user: userId,
            billName,
            amount,
            dueDate,
            budget,
            description,
            type,
            location,
            status
        };
        
        // Set force create flag if needed
        if (forceCreate) {
            billData._forceCreate = true;
        }
        
        const bill = await Bill.create(billData);

        // Populate budget information
        await bill.populate({
            path: 'budget',
            populate: {
                path: 'categoryID',
                model: 'Category'
            }
        });
        
        console.log('Created bill:', bill);

        return {
            success: true,
            bill,
            budgetDetails: bill.budget ? {
                spent: bill.budget.spent,
                total: bill.budget.amount,
                percentage: (bill.budget.spent / bill.budget.amount) * 100
            } : null
        };
    } catch (error) {
        console.error('Error in createBill:', error);
        if (error.name === 'BudgetError') {
            return {
                success: false,
                message: error.message,
                budgetError: error.budgetDetails
            };
        }
        throw error;
    }
};

const getBills = async (userId, filters = {}) => {
    const query = { user: userId };
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.budget) query.budget = filters.budget;
    if (filters.startDate && filters.endDate) {
        query.dueDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    // Populate budget and its category
    return await Bill.find(query)
        .populate({
            path: 'budget',
            populate: {
                path: 'categoryID',
                model: 'Category'
            }
        })
        .sort({ dueDate: 1 });
};

const getBillById = async (billID) => {  
    return await Bill.findById(billID).populate('category');
};

const updateBill = async (billID, { billName, amount, dueDate, budgetId, description, type, location, status }) => {
    try {
        const updateData = {};
        if (billName) updateData.billName = billName;
        if (amount) updateData.amount = amount;
        if (dueDate) updateData.dueDate = dueDate;
        if (budgetId) updateData.budget = budgetId;
        if (description) updateData.description = description;
        if (type) updateData.type = type;
        if (location) updateData.location = location;
        if (status) updateData.status = status;

        const updatedBill = await Bill.findByIdAndUpdate(
            billID,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: 'budget',
            populate: {
                path: 'categoryID',
                model: 'Category'
            }
        });

        if (!updatedBill) {
            throw new Error('Bill not found');
        }

        return {
            bill: updatedBill,
            budgetDetails: updatedBill.budget ? {
                spent: updatedBill.budget.spent,
                total: updatedBill.budget.amount,
                percentage: (updatedBill.budget.spent / updatedBill.budget.amount) * 100
            } : null
        };
    } catch (error) {
        if (error.name === 'BudgetError') {
            return {
                bill: null,
                budgetError: error.budgetDetails
            };
        }
        throw error;
    }
};

const updateBillStatus = async (billID, status) => {
    try {
        const bill = await Bill.findById(billID).populate({
            path: 'budget',
            populate: {
                path: 'categoryID',
                model: 'Category'
            }
        });
        if (!bill) {
            throw new Error('Bill not found');
        }

        // If bill is being marked as paid, create a transaction
        if (status === 'paid' && bill.status !== 'paid') {
            console.log('Creating transaction for bill:', bill._id);
            const transaction = await transactionService.createTransaction({
                user: bill.user,
                bill: bill._id,
                amount: bill.amount,
                type: 'bill_payment',
                category: bill.budget.categoryID,
                description: `Payment for ${bill.billName}`,
                date: bill.dueDate
            });
            console.log('Transaction created:', transaction._id);
        }

        bill.status = status;
        await bill.save();
        return bill;
    } catch (error) {
        console.error('Error in updateBillStatus:', error);
        throw error;
    }
};

const deleteBill = async (billID) => {
    return await Bill.findByIdAndDelete(billID);
};

const deleteAllBills = async () => {
    await Bill.deleteMany({});
    return null;
};

// New functions for expense tracking
const getExpenseSummary = async (userId, startDate, endDate) => {
    const expenses = await Bill.find({
        user: userId,
        dueDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        },
        status: 'paid'
    }).populate('category');

    const summary = {
        total: 0,
        byCategory: {},
        byDate: {},
        byType: {}
    };

    expenses.forEach(expense => {
        // Calculate total
        summary.total += expense.amount;

        // Group by category
        const categoryName = expense.category?.categoryName || 'Uncategorized';
        summary.byCategory[categoryName] = (summary.byCategory[categoryName] || 0) + expense.amount;

        // Group by date
        const date = expense.dueDate.toISOString().split('T')[0];
        summary.byDate[date] = (summary.byDate[date] || 0) + expense.amount;

        // Group by type
        const type = expense.type || 'manual';
        summary.byType[type] = (summary.byType[type] || 0) + expense.amount;
    });

    return summary;
};

const getExpenseTrends = async (userId, period = 'month') => {
    const now = new Date();
    let startDate;

    // Clone current date to avoid modifying it
    const currentDate = new Date(now);
    
    switch (period) {
        case 'week':
            // Get start of current day
            startDate = new Date(currentDate.setHours(0, 0, 0, 0));
            // Go back 6 days to get a full week including today
            startDate.setDate(startDate.getDate() - 6);
            break;
        case 'month':
            startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
            break;
        case 'year':
            startDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
            break;
        default:
            startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
    }

    const expenses = await Bill.find({
        user: userId,
        dueDate: { $gte: startDate, $lte: new Date() },
        status: 'paid'
    }).populate('budget');

    const trends = {
        daily: {},
        weekly: {},
        monthly: {}
    };

    // Initialize all days in the range with 0
    let currentDay = new Date(startDate);
    const endDate = new Date();
    while (currentDay <= endDate) {
        const dayKey = currentDay.toISOString().split('T')[0];
        trends.daily[dayKey] = 0;

        // Initialize week
        const weekStart = new Date(currentDay);
        weekStart.setDate(currentDay.getDate() - currentDay.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!trends.weekly[weekKey]) {
            trends.weekly[weekKey] = 0;
        }

        // Move to next day
        currentDay.setDate(currentDay.getDate() + 1);
    }

    // Add expense amounts
    expenses.forEach(expense => {
        const date = new Date(expense.dueDate);
        
        // Daily trend
        const dayKey = date.toISOString().split('T')[0];
        trends.daily[dayKey] += expense.amount;

        // Weekly trend - using ISO week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!trends.weekly[weekKey]) {
            trends.weekly[weekKey] = 0;
        }
        trends.weekly[weekKey] += expense.amount;

        // Monthly trend
        const monthKey = date.toLocaleString('default', { month: 'short' });
        trends.monthly[monthKey] = (trends.monthly[monthKey] || 0) + expense.amount;
    });

    return trends;
};

const scanBill = async (userId, imageBase64) => {
    try {
        // Initialize Tesseract worker
        const worker = await createWorker('vie'); // Use Vietnamese language

        // Process image with sharp to improve OCR accuracy
        const processedImage = await sharp(Buffer.from(imageBase64, 'base64'))
            .resize(2000) // Resize to reasonable size
            .normalize() // Normalize contrast
            .toBuffer();

        // Perform OCR
        const { data: { text } } = await worker.recognize(processedImage);
        await worker.terminate();

        // Parse the extracted text
        const parsedData = parseBillText(text);
        
        // Create new bill with parsed data
        const bill = new Bill({
            user: userId,
            date: parsedData.date,
            total: parsedData.total,
            items: parsedData.items,
            image: imageBase64,
            type: 'receipt',
            status: 'unpaid'
        });

        // Save the bill
        await bill.save();

        return bill;
    } catch (error) {
        console.error('Error in scanBill service:', error);
        throw new Error('Failed to scan bill');
    }
};

const updateScannedBill = async (userId, billId, updates) => {
    try {
        const bill = await Bill.findOne({ _id: billId, user: userId });

        if (!bill) {
            throw new Error('Bill not found');
        }

        // Update bill with new data
        if (updates.items) bill.items = updates.items;
        if (updates.total) bill.total = updates.total;
        if (updates.date) bill.date = updates.date;
        if (updates.type) bill.type = updates.type;
        if (updates.status) bill.status = updates.status;
        if (updates.category) bill.category = updates.category;
        if (updates.description) bill.description = updates.description;
        if (updates.location) bill.location = updates.location;

        await bill.save();

        return bill;
    } catch (error) {
        console.error('Error in updateScannedBill service:', error);
        throw error;
    }
};

module.exports = {
    createBill,
    getBills,
    getBillById,
    updateBill,
    updateBillStatus,
    deleteBill,
    deleteAllBills,
    scanBill,
    updateScannedBill,
    getExpenseSummary,
    getExpenseTrends
};
