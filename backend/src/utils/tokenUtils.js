const jwt = require("jsonwebtoken");

const generateToken = (userID) => {
    return jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
        });
    });
};

module.exports = { generateToken, verifyToken };
