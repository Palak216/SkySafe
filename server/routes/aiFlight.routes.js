const express = require("express");
const rateLimit = require("express-rate-limit");
const { searchFlightsAI } = require("../controllers/aiFlight.controller");

const router = express.Router();

// Each call can spend LLM quota, so keep this tighter than the global limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many search requests. Please wait a minute and try again.",
  },
});

const validateMessage = (req, res, next) => {
  const message = req.body && req.body.message;
  if (typeof message !== "string" || message.trim().length === 0 || message.length > 300) {
    return res.status(400).json({
      success: false,
      message: "Please enter a travel query of up to 300 characters.",
    });
  }
  next();
};

// Natural language flight search
router.post("/flights/search", aiLimiter, validateMessage, searchFlightsAI);

module.exports = router;