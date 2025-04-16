const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Token', TokenSchema); 