// controllers/bill.controller.js
const billService = require("../services/bill.service");

exports.createBill = async (req, res) => {
    try {
        const bill = await billService.createBill(req.body);
        res.status(201).json({ success: true, data: bill });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getBillById = async (req, res) => {
    try {
        const bill = await billService.getBillById(req.params.id);
        if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
        res.status(200).json({ success: true, data: bill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBills = async (req, res) => {
    try {
        const bills = await billService.getAllBills();
        res.status(200).json({ success: true, data: bills });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBillById = async (req, res) => {
    try {
        const updatedBill = await billService.updateBill(req.params.id, req.body);
        if (!updatedBill) return res.status(404).json({ success: false, message: "Bill not found" });
        res.status(200).json({ success: true, data: updatedBill });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteBillById = async (req, res) => {
    try {
        const deletedBill = await billService.deleteBill(req.params.id);
        if (!deletedBill) return res.status(404).json({ success: false, message: "Bill not found" });
        res.status(200).json({ success: true, message: "Bill deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteBills = async (req, res) => {
    try {
        await billService.deleteAllBills();
        res.status(200).json({ success: true, message: "All bills deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
