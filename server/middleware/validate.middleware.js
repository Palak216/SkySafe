const AppError = require("../utils/AppError");

/**
 * Zod validation middleware factory
 * @param {import("zod").ZodSchema | { body?: import("zod").ZodSchema, query?: import("zod").ZodSchema, params?: import("zod").ZodSchema }} schema
 */
const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    // If schema is a direct ZodObject (fallback for body)
    if (!schema.body && !schema.query && !schema.params && schema.parse) {
      req.body = schema.parse(req.body);
    }
    next();
  } catch (err) {
    if (err.name === "ZodError") {
      const formattedErrors = err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));
      return next(new AppError("Validation failed", 400, formattedErrors));
    }
    return next(err);
  }
};

module.exports = validate;
