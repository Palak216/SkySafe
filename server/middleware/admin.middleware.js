const AppError = require("../utils/AppError");

/**
 * Role-based authorization middleware factory
 * @param  {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Forbidden: Insufficient privileges for this action.", 403));
    }

    next();
  };
};

const adminMiddleware = requireRole("admin");

module.exports = adminMiddleware;
module.exports.requireRole = requireRole;
module.exports.adminMiddleware = adminMiddleware;
