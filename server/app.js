const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");

const app = express();

// ===============================
// Middlewares
// ===============================

// Allow Frontend to Access Backend
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// Parse JSON Request Body
app.use(express.json());

// Parse Cookies
app.use(cookieParser());

// ===============================
// Routes
// ===============================

// Home Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to SkySafe API ✈️"
    });
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// ===============================
// 404 Route
// ===============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });
});

module.exports = app;