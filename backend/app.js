require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./src/config/database");
const routes = require("./src/routes"); // Import index.js của routes
const { globalErrorHandler } = require("./src/utils/errorHandler");
const { apiLimiter } = require("./src/middlewares/rateLimiter");
const { generateUUID } = require("./src/utils/generateUniqueId"); // Import generateUUID

const app = express();
const PORT = process.env.PORT || 4000;
const API_PASSWORD = process.env.API_PASSWORD; // Lấy mật khẩu API từ .env
connectDB();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Middleware check api key
app.use((req, res, next) => {
  const apiPassword = req.headers["x-api-key"];

  if (!apiPassword || apiPassword !== API_PASSWORD) {
      return res.status(403).json({ message: "Forbidden: Invalid API Password" });
  }
  
  next();
});

// Middleware to attach a unique request ID
app.use((req, res, next) => {
  req.requestId = generateUUID(); // Attach a unique ID to each request
  console.log(`Request ID: ${req.requestId}`);
  next();
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});


// Rate limiter to reducing spam requests
app.use("/api", apiLimiter);

app.use("/api", routes); // Only one routes

// Định nghĩa route
app.get("/api", (req, res) => {
  res.json({ message: "API is working!" });
});

app.get("/", (req, res) => {
  res.send("🚀 Personal Finance Management API is running...");
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
