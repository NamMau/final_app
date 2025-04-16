const Category = require("../models/Category.model");

exports.createCategory = async ({ userID, categoryName, description, type }) => {
    return await Category.create({
        user: userID,
        categoryName,
        description,
        type
    });
};

exports.getCategories = async (userID, filters = {}) => {
    const query = { user: userID };
    
    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.categoryName) {
        query.categoryName = { $regex: filters.categoryName, $options: 'i' };
    }
    return await Category.find(query).sort({ categoryName: 1 });
};

exports.updateCategory = async (categoryID, { categoryName, description, type }) => {
    const updateData = {};
    if (categoryName) updateData.categoryName = categoryName;
    if (description) updateData.description = description;
    if (type) updateData.type = type;

    return await Category.findByIdAndUpdate(
        categoryID,
        updateData,
        { new: true, runValidators: true }
    );
};

exports.deleteCategory = async (categoryID) => {
    return await Category.findByIdAndDelete(categoryID);
};
