// controllers/category.controller.js
const categoryService = require("../services/category.service");

exports.createCategory = async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body.userID, req.body.categoryName);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await categoryService.getCategories(req.body.userID);
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCategoryById = async (req, res) => {
    try {
        const updatedCategory = await categoryService.updateCategory(req.params.id, req.body.categoryName);
        res.status(200).json({ success: true, data: updatedCategory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.deleteCategoryById = async (req, res) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
