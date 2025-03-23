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

const createBill = async (userID, billName, amount, dueDate, status = "unpaid") => {
    return await Bill.create({ user: userID, billName, amount, dueDate, status });
};

const getBills = async (userID) => {
    return await Bill.find({ user: userID });
};

const getBillById = async (billID) => {  
    return await Bill.findById(billID);
};

const updateBill = async (billID, updateData) => { 
    return await Bill.findByIdAndUpdate(billID, updateData, { new: true });
};

const updateBillStatus = async (billID, status) => {
    return await Bill.findByIdAndUpdate(billID, { status }, { new: true });
};

const deleteBill = async (billID) => {
    return await Bill.findByIdAndDelete(billID);
};

const deleteAllBills = async () => { 
    return await Bill.deleteMany({});
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
            userId,
            date: parsedData.date,
            total: parsedData.total,
            items: parsedData.items,
            image: imageBase64
        });

        // Save the bill
        await bill.save();

        return {
            success: true,
            data: {
                bill: {
                    id: bill._id,
                    date: bill.date,
                    total: bill.total,
                    items: bill.items,
                    image: bill.image
                }
            }
        };
    } catch (error) {
        console.error('Error in scanBill service:', error);
        throw new Error('Failed to scan bill');
    }
};

const updateScannedBill = async (userId, billId, updates) => {
    try {
        const bill = await Bill.findOne({ _id: billId, userId });

        if (!bill) {
            throw new Error('Bill not found');
        }

        // Update bill with new data
        if (updates.items) bill.items = updates.items;

        await bill.save();

        return {
            success: true,
            data: {
                bill: {
                    id: bill._id,
                    date: bill.date,
                    total: bill.total,
                    items: bill.items,
                    image: bill.image
                }
            }
        };
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
