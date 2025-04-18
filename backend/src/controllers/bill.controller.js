// controllers/bill.controller.js
const { billService } = require('../services/bill.service');
const { handleError } = require('../utils/errorHandler');

const createBill = async (req, res) => {
    try {
        const { billName, amount, dueDate, categoryID, description, type, location, tags } = req.body;
        const userId = req.user.id;

        const bill = await billService.createBill({
            userId,
            billName,
            amount,
            dueDate,
            categoryID,
            description,
            type,
            location,
            tags
        });

        res.status(201).json({
            success: true,
            data: bill,
            message: 'Bill created successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getBills = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, type, category, startDate, endDate } = req.query;

        const bills = await billService.getBills(userId, {
            status,
            type,
            category,
            startDate,
            endDate
        });

        res.status(200).json({
            success: true,
            data: bills
        });
    } catch (error) {
        handleError(res, error);
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

        res.status(200).json({
            success: true,
            data: bill
        });
    } catch (error) {
        handleError(res, error);
    }
};

const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const bill = await billService.updateBill(id, updateData);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bill,
            message: 'Bill updated successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

const updateBillStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const bill = await billService.updateBillStatus(id, status);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bill,
            message: 'Bill status updated successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

const deleteBill = async (req, res) => {
    try {
        const { id } = req.params;
        await billService.deleteBill(id);

        res.status(200).json({
            success: true,
            message: 'Bill deleted successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// New endpoints for expense tracking
const getExpenseSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        const summary = await billService.getExpenseSummary(userId, startDate, endDate);

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getExpenseTrends = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period } = req.query;

        const trends = await billService.getExpenseTrends(userId, period);

        res.status(200).json({
            success: true,
            data: trends
        });
    } catch (error) {
        handleError(res, error);
    }
};

const scanBill = async (req, res) => {
    try {
        const userId = req.user.id;
        const { imageBase64 } = req.body;

        const bill = await billService.scanBill(userId, imageBase64);

        res.status(200).json({
            success: true,
            data: bill,
            message: 'Bill scanned successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

const updateScannedBill = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        const bill = await billService.updateScannedBill(userId, id, updates);

        res.status(200).json({
            success: true,
            data: bill,
            message: 'Scanned bill updated successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    createBill,
    getBills,
    getBillById,
    updateBill,
    updateBillStatus,
    deleteBill,
    getExpenseSummary,
    getExpenseTrends,
    scanBill,
    updateScannedBill
};
