const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
} = require("../controllers/auth.controller");
const requireAuth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../validations/auth.validation");

const router = express.Router();

// Strict rate limit for auth endpoints: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    message: "Too many login/registration attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register User
router.post("/register", authLimiter, validate(registerSchema), registerUser);

// Login User
router.post("/login", authLimiter, validate(loginSchema), loginUser);

// Logout User
router.post("/logout", logoutUser);

// Profile
router.get("/profile", requireAuth, getProfile);

module.exports = router;
