const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const {
    addFlight,
    getAllFlights,
    getFlightById,
    updateFlight,
    deleteFlight,
    searchFlights,
} = require("../controllers/flight.controller");

const router = express.Router();

// Public Routes
router.get("/", getAllFlights);
router.get("/search", searchFlights);
router.get("/:id", getFlightById);

// Admin Routes
router.post("/", authMiddleware, adminMiddleware, addFlight);

router.put("/:id", authMiddleware, adminMiddleware, updateFlight);

router.delete("/:id", authMiddleware, adminMiddleware, deleteFlight);

module.exports = router;