const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const AppError = require("./utils/AppError");
const errorHandler = require("./middleware/error.middleware");

// Route imports
const authRoutes = require("./routes/auth.routes");
const flightRoutes = require("./routes/flight.routes");
const bookingRoutes = require("./routes/booking.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const aiFlightRoutes = require("./routes/aiFlight.routes");

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Strict CORS (only CLIENT_URL, credentials true)
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Razorpay-Signature"],
  })
);

// 3. General API Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

// 4. Raw body parsing for Razorpay Webhooks (Express requires raw buffer before express.json)
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);

// 5. Standard body parsing & Cookie parsing
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(cookieParser());

// 6. Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// 7. Base Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to SkySafe API ✈️",
  });
});

// 8. Application Routes
app.use("/api/auth", authRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiFlightRoutes);

// 9. Unhandled Routes (404)
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// 10. Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
