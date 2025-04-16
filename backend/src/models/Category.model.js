const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categoryName: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['expense', 'income', 'both'], default: 'expense' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Category", CategorySchema);
