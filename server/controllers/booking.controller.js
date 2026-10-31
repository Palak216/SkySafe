const bookingService = require("../services/booking.service");
const { generateETicketPDF } = require("../services/ticket.service");

/**
 * Create a new booking
 * POST /api/bookings
 */
const bookFlight = async (req, res, next) => {
  try {
    const { flightId, passengers } = req.body;

    const booking = await bookingService.createBooking({
      userId: req.user.id,
      flightId,
      passengers,
    });

    return res.status(201).json({
      success: true,
      message: "Flight reserved successfully. Please complete payment within 10 minutes.",
      data: booking,
      booking, // backward compatibility
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get My Bookings (Paginated)
 * GET /api/bookings or GET /api/bookings/my
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;

    const result = await bookingService.getUserBookings({
      userId: req.user.id,
      role: req.user.role,
      page,
      limit,
      status,
    });

    return res.status(200).json({
      success: true,
      count: result.bookings.length,
      data: result,
      bookings: result.bookings, // backward compatibility
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Booking By ID
 * GET /api/bookings/:id
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return res.status(200).json({
      success: true,
      data: booking,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel Booking
 * POST /api/bookings/:id/cancel (or DELETE /api/bookings/:id)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const reason = req.body?.reason || "User requested cancellation";

    const result = await bookingService.cancelBooking({
      bookingId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
      reason,
    });

    return res.status(200).json({
      success: true,
      message: result.refund
        ? `Booking cancelled successfully. Refund of ₹${result.refund.amount} initiated.`
        : "Booking cancelled successfully.",
      data: result,
      booking: result.booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download PDF E-Ticket
 * GET /api/bookings/:id/ticket
 */
const downloadETicket = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    generateETicketPDF(booking, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookFlight,
  getMyBookings,
  getBookingById,
  cancelBooking,
  downloadETicket,
};
