const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const paymentService = require("./payment.service");
const { sendBookingConfirmation, sendCancellationNotification } = require("./email.service");

/**
 * Atomically create a booking and reserve seats
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.flightId - Flight ObjectId
 * @param {Array<{name: string, age: number, gender: string, seatNumber?: string}>} params.passengers
 * @returns {Promise<Object>} Created pending booking
 */
const createBooking = async ({ userId, flightId, passengers }) => {
  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    throw new AppError("At least one passenger is required", 400);
  }

  const seatsRequested = passengers.length;

  // 1. Atomically reserve seats on SCHEDULED flight
  const flight = await Flight.findOneAndUpdate(
    {
      _id: flightId,
      status: "SCHEDULED",
      availableSeats: { $gte: seatsRequested },
    },
    {
      $inc: { availableSeats: -seatsRequested },
    },
    {
      new: true,
    }
  );

  if (!flight) {
    throw new AppError(
      "Not enough seats available or flight is no longer scheduled",
      400
    );
  }

  // 2. Compute total amount (price snapshot at booking time)
  const totalAmount = flight.price * seatsRequested;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  try {
    const booking = await Booking.create({
      user: userId,
      flight: flightId,
      passengers,
      seatsBooked: seatsRequested,
      totalAmount,
      status: "PENDING_PAYMENT",
      expiresAt,
    });

    return booking;
  } catch (error) {
    // 3. Compensation: restore atomically reserved seats if booking document creation fails
    console.error("Booking creation failed, restoring reserved seats...", error);
    await Flight.findByIdAndUpdate(flightId, {
      $inc: { availableSeats: seatsRequested },
    });
    throw new AppError(`Failed to create booking: ${error.message}`, 500);
  }
};

/**
 * Get paginated bookings for a user (or all bookings for admin)
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.role - 'user' or 'admin'
 * @param {number} [params.page=1]
 * @param {number} [params.limit=10]
 * @param {string} [params.status]
 * @returns {Promise<{ bookings: Array, pagination: Object }>}
 */
const getUserBookings = async ({ userId, role, page = 1, limit = 10, status }) => {
  const filter = {};
  if (role !== "admin") {
    filter.user = userId;
  }
  if (status) {
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Booking.countDocuments(filter);
  const totalPages = Math.ceil(total / Number(limit)) || 1;

  const bookings = await Booking.find(filter)
    .populate("flight")
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return {
    bookings,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get booking by ID with ownership check
 * @param {string} bookingId
 * @param {string} userId
 * @param {string} role
 * @returns {Promise<Object>}
 */
const getBookingById = async (bookingId, userId, role) => {
  const booking = await Booking.findById(bookingId).populate("flight").populate("user", "name email");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (role !== "admin" && booking.user._id.toString() !== userId.toString()) {
    throw new AppError("Access denied: You do not own this booking", 403);
  }

  return booking;
};

/**
 * Cancel a booking and restore seats idempotently
 * If confirmed & paid, calculate policy refund and call Razorpay refunds API
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {string} params.userId
 * @param {string} params.role
 * @param {string} [params.reason]
 * @returns {Promise<{ booking: Object, refund: Object|null }>}
 */
const cancelBooking = async ({ bookingId, userId, role, reason = "User requested cancellation" }) => {
  const booking = await Booking.findById(bookingId).populate("flight");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Authorization check: owner or admin
  if (role !== "admin" && booking.user.toString() !== userId.toString()) {
    throw new AppError("Not authorized to cancel this booking", 403);
  }

  if (booking.status === "CANCELLED") {
    throw new AppError("Booking is already cancelled", 400);
  }

  if (booking.status === "EXPIRED") {
    throw new AppError("Cannot cancel an expired reservation", 400);
  }

  // Atomically update booking status to CANCELLED to prevent race conditions
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: { $in: ["CONFIRMED", "PENDING_PAYMENT"] },
    },
    {
      $set: {
        status: "CANCELLED",
        "cancellation.cancelledAt": new Date(),
        "cancellation.cancelledBy": userId,
        "cancellation.reason": reason,
      },
    },
    { new: true }
  ).populate("flight");

  if (!updatedBooking) {
    throw new AppError("Booking has already been cancelled or expired", 400);
  }

  // Atomically restore seats exactly once
  await Flight.findByIdAndUpdate(updatedBooking.flight._id, {
    $inc: { availableSeats: updatedBooking.seatsBooked },
  });

  let refundResult = null;

  // If booking was paid, calculate policy refund and trigger Razorpay refund API
  if (booking.payment && booking.payment.status === "PAID" && booking.payment.razorpayPaymentId) {
    const flightDepTime = new Date(updatedBooking.flight.departureTime);
    const now = new Date();
    const hoursToDeparture = (flightDepTime - now) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursToDeparture > 24) {
      refundPercentage = 1.0; // 100% full refund
    } else if (hoursToDeparture > 0) {
      refundPercentage = 0.5; // 50% refund within 24h
    } else {
      refundPercentage = 0; // No refund post-departure
    }

    const refundAmount = Math.round(updatedBooking.totalAmount * refundPercentage);
    const amountInPaise = refundAmount * 100;

    if (amountInPaise > 0) {
      try {
        const rzpRefund = await paymentService.processRefund({
          paymentId: booking.payment.razorpayPaymentId,
          amountInPaise,
          notes: {
            bookingId: booking._id.toString(),
            pnr: booking.pnr,
            hoursToDeparture: hoursToDeparture.toFixed(1),
          },
        });

        updatedBooking.payment.status = "REFUNDED";
        updatedBooking.payment.refundId = rzpRefund.id;
        updatedBooking.payment.refundAmount = refundAmount;
        updatedBooking.payment.refundStatus = rzpRefund.status || "processed";
        updatedBooking.payment.refundedAt = new Date();
        updatedBooking.cancellation.refundAmount = refundAmount;
        updatedBooking.cancellation.refundStatus = rzpRefund.status || "processed";
        await updatedBooking.save();

        refundResult = {
          id: rzpRefund.id,
          amount: refundAmount,
          status: rzpRefund.status || "processed",
          percentage: `${refundPercentage * 100}%`,
        };
      } catch (refundError) {
        console.error("Razorpay refund execution failed:", refundError);
        updatedBooking.cancellation.refundStatus = "FAILED";
        await updatedBooking.save();
        refundResult = {
          amount: refundAmount,
          status: "MANUAL_REVIEW_REQUIRED",
          error: refundError.message,
        };
      }
    }
  }

  // Non-blocking notification email
  const user = await User.findById(updatedBooking.user);
  if (user) {
    sendCancellationNotification({
      user,
      booking: updatedBooking,
      flight: updatedBooking.flight,
      refund: refundResult,
    });
  }

  return {
    booking: updatedBooking,
    refund: refundResult,
  };
};

/**
 * Confirm booking payment idempotently
 * Handles late payments post-expiration (auto-refund), duplicate verify, webhooks
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {string} params.razorpayOrderId
 * @param {string} params.razorpayPaymentId
 * @param {string} [params.razorpaySignature]
 * @param {string} [params.eventId] - Webhook event ID for deduplication
 * @returns {Promise<{ booking: Object, message: string, autoRefunded?: boolean }>}
 */
const confirmBookingPayment = async ({
  bookingId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  eventId,
}) => {
  const booking = await Booking.findById(bookingId).populate("flight");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Deduplicate webhook replays
  if (eventId && booking.processedWebhookEvents?.includes(eventId)) {
    return { booking, message: "Webhook event already processed" };
  }

  // If already confirmed: idempotent success
  if (booking.status === "CONFIRMED") {
    if (eventId) {
      booking.processedWebhookEvents.push(eventId);
      await booking.save();
    }
    return { booking, message: "Booking is already confirmed" };
  }

  // Edge case: payment arrives after reservation has EXPIRED or CANCELLED
  if (booking.status === "EXPIRED" || booking.status === "CANCELLED") {
    console.warn(
      `⚠️ Late payment for ${booking.status} booking ${booking._id}. Triggering auto-refund...`
    );

    try {
      const refund = await paymentService.processRefund({
        paymentId: razorpayPaymentId,
        amountInPaise: booking.totalAmount * 100,
        notes: {
          reason: `Automatic refund: Payment completed after booking ${booking.status.toLowerCase()}`,
          bookingId: booking._id.toString(),
          pnr: booking.pnr,
        },
      });

      booking.payment.status = "REFUNDED";
      booking.payment.razorpayPaymentId = razorpayPaymentId;
      booking.payment.razorpayOrderId = razorpayOrderId;
      booking.payment.refundId = refund.id;
      booking.payment.refundAmount = booking.totalAmount;
      booking.payment.refundStatus = refund.status || "processed";
      booking.payment.refundedAt = new Date();
      booking.payment.failureReason = `Payment arrived after reservation ${booking.status}. Auto-refunded.`;
      if (eventId) booking.processedWebhookEvents.push(eventId);
      await booking.save();

      return {
        booking,
        autoRefunded: true,
        message: `Booking had ${booking.status.toLowerCase()}. A full refund of ₹${booking.totalAmount} has been automatically processed.`,
      };
    } catch (refundErr) {
      console.error("Auto-refund failed for late payment:", refundErr);
      booking.payment.failureReason = `Payment after expiry; refund failed: ${refundErr.message}`;
      if (eventId) booking.processedWebhookEvents.push(eventId);
      await booking.save();

      return {
        booking,
        autoRefunded: false,
        message: "Payment arrived after reservation expired. Our team will initiate your refund.",
      };
    }
  }

  // Normal flow: Booking is PENDING_PAYMENT
  // Atomically transition from PENDING_PAYMENT to CONFIRMED
  const confirmedBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: "PENDING_PAYMENT",
    },
    {
      $set: {
        status: "CONFIRMED",
        "payment.status": "PAID",
        "payment.razorpayOrderId": razorpayOrderId,
        "payment.razorpayPaymentId": razorpayPaymentId,
        "payment.razorpaySignature": razorpaySignature,
        "payment.paidAt": new Date(),
      },
      $push: eventId ? { processedWebhookEvents: eventId } : {},
    },
    { new: true }
  ).populate("flight");

  if (!confirmedBooking) {
    // Race condition: booking was updated in parallel
    const current = await Booking.findById(bookingId).populate("flight");
    return { booking: current, message: "Booking processed" };
  }

  // Non-blocking confirmation email
  const user = await User.findById(confirmedBooking.user);
  if (user) {
    sendBookingConfirmation({
      user,
      booking: confirmedBooking,
      flight: confirmedBooking.flight,
    });
  }

  return {
    booking: confirmedBooking,
    message: "Payment verified and booking confirmed successfully",
  };
};

/**
 * Handle payment failure
 * @param {Object} params
 * @param {string} params.bookingId
 * @param {string} params.reason
 * @param {string} [params.eventId]
 */
const recordPaymentFailure = async ({ bookingId, reason, eventId }) => {
  const update = {
    $set: {
      "payment.status": "FAILED",
      "payment.failureReason": reason || "Payment transaction failed",
    },
  };
  if (eventId) {
    update.$push = { processedWebhookEvents: eventId };
  }

  await Booking.findByIdAndUpdate(bookingId, update);
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  confirmBookingPayment,
  recordPaymentFailure,
};
