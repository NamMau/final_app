const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  totalBalance: { type: Number, required: true, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Account", AccountSchema);
