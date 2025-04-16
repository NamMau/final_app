const express = require("express");
const { createCategory, getCategories, updateCategoryById, deleteCategoryById } = require("../controllers/category.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/create-category", authMiddleware, createCategory);
router.get("/get-all-categories", authMiddleware, getCategories);
router.put("/update-category-by-id/:id", authMiddleware, updateCategoryById);
router.delete("/delete-category-by-id/:id", authMiddleware, deleteCategoryById);

module.exports = router;
