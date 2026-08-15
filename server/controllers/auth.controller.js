const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==========================
// Register User
// ==========================
const registerUser = async (req, res) => {
    try {
        console.log("REGISTER BODY:", req.body);

        const { name, email, password } = req.body;

        console.log("NAME:", name);
        console.log("EMAIL:", email);
        console.log("PASSWORD EXISTS:", !!password);
        console.log("PASSWORD TYPE:", typeof password);

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
        console.error("REGISTER ERROR:", error);

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
        console.log("========== LOGIN REQUEST ==========");
        console.log("LOGIN BODY:", req.body);
        console.log("EMAIL:", req.body?.email);
        console.log("PASSWORD EXISTS:", !!req.body?.password);
        console.log("PASSWORD TYPE:", typeof req.body?.password);

        const { email, password } = req.body;

        if (!email || !password) {
            console.log("❌ LOGIN FIELDS MISSING");

            return res.status(400).json({
                success: false,
                message: "Please fill all fields",
            });
        }

        console.log("✅ LOGIN FIELDS RECEIVED");

        const user = await User.findOne({ email });

        if (!user) {
            console.log("❌ USER NOT FOUND:", email);

            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        console.log("✅ USER FOUND:", user.email);

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        console.log("PASSWORD MATCH:", isMatch);

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

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        console.log("✅ LOGIN SUCCESS");

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
        console.error("❌ LOGIN ERROR:", error);

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

    res.clearCookie("token");

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