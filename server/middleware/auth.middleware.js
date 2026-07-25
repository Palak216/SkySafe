const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {

        // Get token from cookies
        const token = req.cookies.token;

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please login first"
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Save user info in request
        req.user = decoded;

        // Move to next middleware/route
        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or Expired Token"
        });

    }
};

module.exports = authMiddleware;