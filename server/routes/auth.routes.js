const express = require("express");

const {
    registerUser,
    loginUser,
    logoutUser
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
router.post("/logout", logoutUser);

// ==========================
// Protected Routes
// ==========================

// Get Logged-in User Profile
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;