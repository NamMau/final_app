const express = require("express");
const { createCategory, getCategories, updateCategoryById, deleteCategoryById } = require("../controllers/category.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createCategory);
router.get("/", authMiddleware, getCategories);
router.put("/:id", authMiddleware, updateCategoryById);
router.delete("/:id", authMiddleware, deleteCategoryById);

module.exports = router;
