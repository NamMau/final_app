const Category = require("../models/Category.model");

exports.createCategory = async ({ userId, categoryName, description, icon, color, type }) => {
    console.log('Creating category with userId:', userId);
    return await Category.create({
        userId,  // Fixed: using correct field name
        categoryName,
        description,
        icon,
        color,
        type
    });
};

exports.getCategories = async (userId, filters = {}) => {
    console.log('Getting categories for userId:', userId);
    const query = { userId: userId }; // Fixed: using correct field name
    
    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.categoryName) {
        query.categoryName = { $regex: filters.categoryName, $options: 'i' };
    }

    console.log('Query:', query);
    const categories = await Category.find(query).sort({ categoryName: 1 });
    console.log('Found categories:', categories);
    return categories;
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
