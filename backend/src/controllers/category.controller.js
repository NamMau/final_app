// controllers/category.controller.js
const categoryService = require("../services/category.service");

exports.createCategory = async (req, res) => {
    try {
        const { userID, categoryName, description, icon, color, type } = req.body;
        const category = await categoryService.createCategory({
            userID,
            categoryName,
            description,
            type
        });
        res.status(201).json({ success: true, data: {category} });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const { userID, type, isActive } = req.query;
        const categories = await categoryService.getCategories(userID, { type, isActive });
        res.status(200).json({ success: true, data: {categories} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCategoryById = async (req, res) => {
    try {
        const { categoryName, description, icon, color, type, isActive } = req.body;
        const updatedCategory = await categoryService.updateCategory(req.params.id, {
            categoryName,
            description,
            icon,
            color,
            type,
            isActive
        });
        res.status(200).json({ success: true, data: {updatedCategory} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCategoryById = async (req, res) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.status(200).json({ success: true, message: "Category deleted successfully", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
