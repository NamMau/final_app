const Category = require("../models/Category.model");

exports.createCategory = async ({ userId, categoryName, description, icon, color, type }) => {
    return await Category.create({
        user: userId,
        categoryName,
        description,
        icon,
        color,
        type
    });
};

exports.getCategories = async (userId, filters = {}) => {
    const query = { user: userId };
    
    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.categoryName) {
        query.categoryName = { $regex: filters.categoryName, $options: 'i' };
    }

    return await Category.find(query)
        .sort({ categoryName: 1 });
};

exports.getCategoryById = async (categoryID) => {
    return await Category.findById(categoryID);
};

exports.updateCategory = async (categoryID, { categoryName, description, icon, color, type, isActive }) => {
    const updateData = {};
    if (categoryName) updateData.categoryName = categoryName;
    if (description) updateData.description = description;
    if (icon) updateData.icon = icon;
    if (color) updateData.color = color;
    if (type) updateData.type = type;
    if (isActive !== undefined) updateData.isActive = isActive;

    return await Category.findByIdAndUpdate(
        categoryID,
        updateData,
        { new: true, runValidators: true }
    );
};

exports.deleteCategory = async (categoryID) => {
    // Hard delete
    return await Category.findByIdAndDelete(categoryID);
};
