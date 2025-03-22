const Category = require("../models/Category.model");

exports.createCategory = async (userID, categoryName) => {
    return await Category.create({ user: userID, categoryName });
};

exports.getCategories = async (userID) => {
    return await Category.find({ user: userID });
};

exports.updateCategory = async (categoryID, newCategoryName) => {
    return await Category.findByIdAndUpdate(
        categoryID,
        { categoryName: newCategoryName },
        { new: true, runValidators: true }
    );
};

exports.deleteCategory = async (categoryID) => {
    return await Category.findByIdAndDelete(categoryID);
};
