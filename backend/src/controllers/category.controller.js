// controllers/category.controller.js
const categoryService = require("../services/category.service");

exports.createCategory = async (req, res) => {
    try {
        const { categoryName, description, icon, color, type } = req.body;
        const userId = req.user.id; // Get userID from authenticated user

        console.log('Creating category with data:', {
            userId,
            categoryName,
            description,
            icon,
            color,
            type
        });

        const category = await categoryService.createCategory({
            userId,
            categoryName,
            description,
            icon,
            color,
            type
        });

        res.status(201).json({ 
            success: true, 
            message: "Category created successfully",
            data: { category } 
        });
    } catch (error) {
        console.error('Error creating category:', error);
        if (error.code === 11000) { // Duplicate key error
            res.status(400).json({ 
                success: false, 
                message: "Category name already exists for this user" 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
};

exports.getCategories = async (req, res) => {
    try {
        console.log('Auth user:', req.user);
        const userId = req.user.id; // Get userID from authenticated user
        console.log('Getting categories for userId:', userId);
        const { type, isActive } = req.query;

        const categories = await categoryService.getCategories(userId, { 
            type, 
            isActive 
        });
        console.log('Found categories:', categories);

        res.status(200).json({ 
            success: true, 
            data: categories // Fixed: return categories directly
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: "Category not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: { category } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.updateCategoryById = async (req, res) => {
    try {
        const { categoryName, description, icon, color, type, isActive } = req.body;
        const categoryID = req.params.id;

        const updatedCategory = await categoryService.updateCategory(categoryID, {
            categoryName,
            description,
            icon,
            color,
            type,
            isActive
        });

        if (!updatedCategory) {
            return res.status(404).json({ 
                success: false, 
                message: "Category not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Category updated successfully",
            data: { updatedCategory } 
        });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            res.status(400).json({ 
                success: false, 
                message: "Category name already exists for this user" 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
};

exports.deleteCategoryById = async (req, res) => {
    try {
        const category = await categoryService.deleteCategory(req.params.id);
        
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: "Category not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Category deleted successfully",
            data: null
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
