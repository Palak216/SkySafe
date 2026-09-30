const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==========================
// Register User
// ==========================
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        return res.status(201).json({
            success: true,
            message: "User Registered Successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ==========================
// Login User
// ==========================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// ==========================
// Logout User
// ==========================
const logoutUser = (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
};