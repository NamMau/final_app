const rateLimit = require("express-rate-limit");

exports.apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // Total 300 requests per minute
    message: { success: false, message: "Rate limit exceeded. Please try again later.", status: 429 },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for specific routes that need more frequent access
    skip: (req) => {
        // Allow more requests for static resources and health checks
        return req.path.includes('/health') || req.path.includes('/static');
    }
});
