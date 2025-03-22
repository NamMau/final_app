const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

/**
 * Generate a UUID (Universally Unique Identifier).
 * @returns {string} A unique UUID string.
 */
exports.generateUUID = () => {
    return uuidv4();
};

/**
 * Generate a short unique ID using a random hash.
 * Useful for cases where a shorter ID is preferred.
 * @param {number} length - The length of the generated ID (default: 8).
 * @returns {string} A short unique identifier.
 */
exports.generateShortId = (length = 8) => {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
};
