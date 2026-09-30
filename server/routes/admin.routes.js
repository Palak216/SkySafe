const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const {
    getDashboardStats,
} = require("../controllers/admin.controller");

router.get(
    "/dashboard",
    authMiddleware,
    adminMiddleware,
    getDashboardStats
);

module.exports = router;