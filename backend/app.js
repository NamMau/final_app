require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const connectDB = require("./src/config/database");
const routes = require("./src/routes"); // Import index.js của routes
const { globalErrorHandler } = require("./src/utils/errorHandler");
const { apiLimiter } = require("./src/middlewares/rateLimiter");
const { generateUUID } = require("./src/utils/generateUniqueId"); // Import generateUUID

const app = express();
const PORT = process.env.PORT || 4000;
const API_PASSWORD = process.env.API_PASSWORD; // Lấy mật khẩu API từ .env
connectDB();

// Configure multer for handling file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Make upload middleware available globally
app.locals.upload = upload;

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("dev"));
app.use(express.json({ limit: '10mb' })); // Increase payload limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app;
