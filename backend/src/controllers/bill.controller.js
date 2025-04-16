// controllers/bill.controller.js
const { billService } = require('../services/bill.service');

const createBill = async (req, res) => {
    try {
        const { 
            billName, 
            amount, 
            categoryID,
            description,
            dueDate,
            type,
            location,
            tags 
        } = req.body;
        const userId = req.user.id;

        const bill = await billService.createBill({
            userId,
            billName,
            amount,
            categoryID,
            description,
            dueDate,
            type,
            location,
            tags
        });

        return res.status(201).json({
            success: true,
            data: { bill }
        });
    } catch (error) {
        console.error('Error in createBill controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create bill',
            error: error.message
        });
    }
};

const getBills = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, status, categoryID } = req.query;
        const bills = await billService.getBills(userId, { type, status, categoryID });
        return res.status(200).json({
            success: true,
            data: { bills }
        });
    } catch (error) {
        console.error('Error in getBills controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get bills',
            error: error.message
        });
    }
};

const getBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await billService.getBillById(id);
        
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: { bill }
        });
    } catch (error) {
        console.error('Error in getBillById controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get bill',
            error: error.message
        });
    }
};

const updateBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            billName,
            amount,
            categoryID,
            description,
            dueDate,
            status,
            location,
            tags 
        } = req.body;
        const userId = req.user.id;

        const bill = await billService.updateBill(id, {
            billName,
            amount,
            categoryID,
            description,
            dueDate,
            status,
            location,
            tags
        });
        
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: { bill }
        });
    } catch (error) {
        console.error('Error in updateBillById controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update bill',
            error: error.message
        });
    }
};

const deleteBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const bill = await billService.deleteBill(id);
        
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Bill deleted successfully',
            data: null
        });
    } catch (error) {
        console.error('Error in deleteBillById controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete bill',
            error: error.message
        });
    }
};

const deleteBills = async (req, res) => {
    try {
        const userId = req.user.id;
        await billService.deleteAllBills();
        return res.status(200).json({
            success: true,
            message: 'All bills deleted successfully',
            data: null
        });
    } catch (error) {
        console.error('Error in deleteBills controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete all bills',
            error: error.message
        });
    }
};

const scanBill = async (req, res) => {
    try {
        const { image } = req.body;
        const userId = req.user.id;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        const result = await billService.scanBill(userId, image);
        return res.status(200).json({
            success: true,
            data: {result}
        });
    } catch (error) {
        console.error('Error in scanBill controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to scan bill',
            error: error.message
        });
    }
};

const updateScannedBill = async (req, res) => {
    try {
        const { billId } = req.params;
        const { items } = req.body;
        const userId = req.user.id;

        const result = await billService.updateScannedBill(userId, billId, { items });
        return res.status(200).json({success: true, data: {result}});
    } catch (error) {
        console.error('Error in updateScannedBill controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update bill',
            error: error.message
        });
    }
};

module.exports = {
    createBill,
    getBills,
    getBillById,
    updateBillById,
    deleteBillById,
    deleteBills,
    scanBill,
    updateScannedBill
};
