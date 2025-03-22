require("dotenv").config(); 
const mongoose = require("mongoose");

console.log("JWT_SECRET:", process.env.JWT_SECRET); // check value

const connectDB = async () => {
    try {
        const url = process.env.MONGO_URL;
        if (!url) {
            throw new Error("MONGO_URL is not defined. Check your .env file.");
        }

        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

module.exports = connectDB;
