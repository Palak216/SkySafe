const AppError = require("../utils/AppError");

/**
 * Centralized Global Error Handler
 * Enforces unified response envelope: { success, data?, message?, errors? }
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    error = new AppError(`Invalid resource identifier for field '${err.path}'`, 400);
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = new AppError(`Duplicate value for '${field}'. Please use another value.`, 400);
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new AppError("Database validation failed", 400, errors);
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid authentication token", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Authentication token has expired. Please log in again.", 401);
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || "Internal Server Error",
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV === "development" && statusCode === 500) {
    response.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error("🔥 [SERVER ERROR]", err);
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
