const express = require("express");
const {
  bookFlight,
  getMyBookings,
  getBookingById,
  cancelBooking,
  downloadETicket,
} = require("../controllers/booking.controller");
const requireAuth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createBookingSchema,
  bookingIdParamSchema,
  cancelBookingSchema,
  listBookingsQuerySchema,
} = require("../validations/booking.validation");

const router = express.Router();

// All booking routes require authentication
router.use(requireAuth);

// Create Booking (atomically reserve seats)
router.post("/", validate(createBookingSchema), bookFlight);

// Get My Bookings (Paginated)
router.get("/", validate(listBookingsQuerySchema), getMyBookings);
router.get("/my", validate(listBookingsQuerySchema), getMyBookings);

// Download PDF E-Ticket (must be placed before /:id)
router.get("/:id/ticket", validate(bookingIdParamSchema), downloadETicket);

// Get Single Booking
router.get("/:id", validate(bookingIdParamSchema), getBookingById);

// Cancel Booking (support both POST /:id/cancel and DELETE /:id)
router.post("/:id/cancel", validate(cancelBookingSchema), cancelBooking);
router.delete("/:id", validate(cancelBookingSchema), cancelBooking);

module.exports = router;
