const { Bill } = require('../models/Bill.model');
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');

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

const createBill = async ({ userId, billName, amount, dueDate, categoryID, description, type, location, tags, status = "unpaid" }) => {
    const bill = await Bill.create({
        user: userId,
        billName,
        amount,
        dueDate,
        category: categoryID,
        description,
        type,
        location,
        tags,
        status
    });
    return bill;
};

const getBills = async (userId, filters = {}) => {
    const query = { user: userId };
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.startDate && filters.endDate) {
        query.dueDate = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }
    return await Bill.find(query).populate('category').sort({ dueDate: 1 });
};

const getBillById = async (billID) => {  
    return await Bill.findById(billID).populate('category');
};

const updateBill = async (billID, { billName, amount, dueDate, categoryID, description, type, location, tags, status }) => {
    const updateData = {};
    if (billName) updateData.billName = billName;
    if (amount) updateData.amount = amount;
    if (dueDate) updateData.dueDate = dueDate;
    if (categoryID) updateData.category = categoryID;
    if (description) updateData.description = description;
    if (type) updateData.type = type;
    if (location) updateData.location = location;
    if (tags) updateData.tags = tags;
    if (status) updateData.status = status;

    return await Bill.findByIdAndUpdate(billID, updateData, { new: true }).populate('category');
};

const updateBillStatus = async (billID, status) => {
    return await Bill.findByIdAndUpdate(billID, { status }, { new: true }).populate('category');
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

    switch (period) {
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const expenses = await Bill.find({
        user: userId,
        dueDate: { $gte: startDate },
        status: 'paid'
    }).populate('category');

    const trends = {
        daily: {},
        weekly: {},
        monthly: {}
    };

    expenses.forEach(expense => {
        const date = new Date(expense.dueDate);
        
        // Daily trend
        const dayKey = date.toISOString().split('T')[0];
        trends.daily[dayKey] = (trends.daily[dayKey] || 0) + expense.amount;

        // Weekly trend
        const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`;
        trends.weekly[weekKey] = (trends.weekly[weekKey] || 0) + expense.amount;

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
        if (updates.tags) bill.tags = updates.tags;

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
