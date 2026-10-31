const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

/**
 * Authentication Middleware
 * Checks JWT in HTTP-only cookies or Authorization Bearer header
 */
const requireAuth = (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Also support Bearer token from headers
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("Authentication required. Please log in.", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please log in again.", 401));
    }
    return next(new AppError("Invalid authentication token.", 401));
  }
};

// Aliases for compatibility
module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.authMiddleware = requireAuth;
