exports.catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

exports.globalErrorHandler = (err, req, res, next) => {
    console.log("Error:", err); 
    res.status(500).json({ success: false, message: err.message || "Server Error" });
};

exports.handleError = (res, error) => {
    console.log("Error:", error);
    res.status(500).json({
        success: false,
        message: error.message || "Server Error"
    });
};
