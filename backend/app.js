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


//app.set('trust proxy', true);

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
// const corsOptions = {
//   origin: ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:8081', 
//            'http://192.168.1.7:4000', 'http://192.168.1.7:3000', 
//            'exp://192.168.1.12:8081', 'exp://192.168.1.7:8081', 'exp://192.168.1.15:8081'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type', 
//     'Authorization', 
//     'x-api-key',
//     'Accept',
//     'Origin',
//     'X-Requested-With'
//   ],
//   exposedHeaders: ['Content-Range', 'X-Content-Range'],
//   credentials: true,
//   maxAge: 86400 // 24 hours
// };
// Set up CORS to allow requests from ngrok and Expo
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow specific origins
    const allowedOrigins = [
      'https://3897-2001-ee0-8209-1109-28d5-8e30-9009-854d.ngrok-free.app',
      'https://f00d-2001-ee0-8209-1109-28d5-8e30-9009-854d.ngrok-free.app/api',
      'https://3367-2001-ee0-8209-1109-99-2f89-e0a2-59b8.ngrok-free.app',
      'http://y7evpj4-anonymous-4000.exp.direct',
      'exp://y7evpj4-anonymous-4000.exp.direct'
    ];
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('ngrok-free.app') || origin.includes('exp.direct')) {
      callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      callback(null, true); // Still allow for development
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// Configure Helmet with settings optimized for development with external connections
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  xssFilter: true,
  hsts: false,  // Disable HTTP Strict Transport Security for development
  dnsPrefetchControl: false, // Allow DNS prefetching
  frameguard: false, // Allow iframes for development
  permittedCrossDomainPolicies: false, // Allow cross-domain policies
  referrerPolicy: { policy: 'no-referrer-when-downgrade' } // Less restrictive referrer policy
}));

// Add additional headers for CORS and security
app.use((req, res, next) => {
  // Allow requests from any origin for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Log request origin for debugging
  console.log(`Request from origin: ${req.headers.origin || 'No origin'} to ${req.method} ${req.url}`);
  
  next();
});


app.use(morgan("dev"));
app.use(express.json({ limit: '10mb' })); // Increase payload limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log('\n=== New Request ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('IP:', req.ip);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('==================\n');
  next();
});

// Middleware check api key
app.use((req, res, next) => {
  console.log('\n=== Checking API Key ===');
  console.log('Received API Key:', req.headers["x-api-key"]);
  console.log('Expected API Key:', API_PASSWORD);
  
  const apiPassword = req.headers["x-api-key"];
  if (!apiPassword || apiPassword !== API_PASSWORD) {
      console.log('❌ Invalid API Key');
      return res.status(403).json({ message: "Forbidden: Invalid API Password" });
  }
  
  console.log('✅ API Key Valid');
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

// Listen on all network interfaces (0.0.0.0) to allow external connections
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Server is accessible at http://localhost:${PORT} and via network interfaces`);
});

module.exports = app;
