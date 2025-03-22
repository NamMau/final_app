const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  categoryName: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model("Category", CategorySchema);
