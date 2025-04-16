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

const createBill = async ({ userID, billName, amount, dueDate, categoryID, description, type, location, tags, status = "unpaid" }) => {
    const bill = await Bill.create({
        user: userID,
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
};

const getBills = async (userID, filters = {}) => {
    const query = { user: userID };
    
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
    updateScannedBill
};
