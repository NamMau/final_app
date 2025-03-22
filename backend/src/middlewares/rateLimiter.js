const rateLimit = require("express-rate-limit");

exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Total 100 requests in 15 minutes
    message: "You have been sent too much, Pls try later!",
});
