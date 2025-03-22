const Bill = require("../models/Bill.model");

exports.createBill = async (userID, billName, amount, dueDate, status = "unpaid") => {
    return await Bill.create({ user: userID, billName, amount, dueDate, status }); // Thêm billName
};

exports.getBills = async (userID) => {
    return await Bill.find({ user: userID });
};

exports.getBillById = async (billID) => {  
    return await Bill.findById(billID);
};

exports.updateBill = async (billID, updateData) => { 
    return await Bill.findByIdAndUpdate(billID, updateData, { new: true });
};

exports.updateBillStatus = async (billID, status) => {
    return await Bill.findByIdAndUpdate(billID, { status }, { new: true });
};

exports.deleteBill = async (billID) => {
    return await Bill.findByIdAndDelete(billID);
};

exports.deleteAllBills = async () => { 
    return await Bill.deleteMany({});
};
