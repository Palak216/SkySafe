const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const {
    bookFlight,
    getMyBookings,
    cancelBooking,
} = require("../controllers/booking.controller");

router.post("/", authMiddleware, bookFlight);

router.get("/my", authMiddleware, getMyBookings);

router.delete("/:id", authMiddleware, cancelBooking);

module.exports = router;