const express = require("express");

const {
    registerUser,
    loginUser
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// ==========================
// Public Routes
// ==========================

// Register User
router.post("/register", registerUser);

// Login User
router.post("/login", loginUser);

// ==========================
// Protected Routes
// ==========================

// Get Logged-in User Profile
router.get("/profile", authMiddleware, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        user: req.user
    });
});

module.exports = router;