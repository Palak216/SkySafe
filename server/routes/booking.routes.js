const express = require("express");

const {
    bookFlight,
    getMyBookings,
    cancelBooking,
} = require("../controllers/booking.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// All booking routes require login
router.use(authMiddleware);

// Book a flight
router.post("/", bookFlight);

// Get logged-in user's bookings
router.get("/my", getMyBookings);

// Cancel booking
router.patch("/:id/cancel", cancelBooking);

module.exports = router;