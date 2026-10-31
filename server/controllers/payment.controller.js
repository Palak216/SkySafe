const env = require("../config/env");
const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");
const paymentService = require("../services/payment.service");
const bookingService = require("../services/booking.service");

/**
 * Create Razorpay Order for a PENDING_PAYMENT booking
 * POST /api/payments/create-order
 */
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("flight");
    if (!booking) {
      return next(new AppError("Booking not found", 404));
    }

    // Ownership check
    if (booking.user.toString() !== req.user.id.toString()) {
      return next(new AppError("You do not own this booking", 403));
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return next(
        new AppError(`Cannot initiate payment for a ${booking.status.toLowerCase()} booking`, 400)
      );
    }

    // Check if reservation has expired
    if (new Date() > new Date(booking.expiresAt)) {
      booking.status = "EXPIRED";
      await booking.save();
      return next(
        new AppError("Booking reservation has expired. Please select a flight again.", 400)
      );
    }

    // Amount strictly computed from booking totalAmount (never client supplied)
    const amountInPaise = Math.round(booking.totalAmount * 100);

    const order = await paymentService.createOrder({
      bookingId: booking._id,
      amountInPaise,
      currency: "INR",
      notes: {
        pnr: booking.pnr,
        flightNumber: booking.flight?.flightNumber,
      },
    });

    // Store razorpayOrderId on booking
    booking.payment.razorpayOrderId = order.id;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
        pnr: booking.pnr,
        expiresAt: booking.expiresAt,
      },
      // Backward compatibility
      order,
      keyId: env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Razorpay Payment Signature and Confirm Booking
 * POST /api/payments/verify
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Timing-safe HMAC SHA256 signature verification
    const isValid = paymentService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return next(new AppError("Invalid payment signature. Transaction verification failed.", 400));
    }

    // Confirm booking and handle edge cases (expired, replays, double clicks)
    const result = await bookingService.confirmBookingPayment({
      bookingId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        booking: result.booking,
        autoRefunded: result.autoRefunded || false,
      },
      booking: result.booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Razorpay Webhooks with Raw Body Signature Verification
 * POST /api/payments/webhook
 */
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay webhook signature header" });
    }

    const rawBody = req.body; // Buffer from express.raw()
    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.warn("⚠️ Invalid Razorpay webhook signature rejected.");
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    // Parse event payload
    const eventPayload = typeof rawBody === "string" ? JSON.parse(rawBody) : JSON.parse(rawBody.toString("utf8"));
    const eventType = eventPayload.event;
    const eventId = eventPayload.entity ? `${eventPayload.event}_${eventPayload.entity.id}` : `evt_${Date.now()}`;

    console.log(`🔔 [RAZORPAY WEBHOOK] Received event: ${eventType} (ID: ${eventId})`);

    const paymentEntity = eventPayload.payload?.payment?.entity;
    const bookingId = paymentEntity?.notes?.bookingId;

    if (eventType === "payment.captured") {
      if (bookingId && paymentEntity) {
        await bookingService.confirmBookingPayment({
          bookingId,
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
          eventId,
        });
      }
    } else if (eventType === "payment.failed") {
      if (bookingId && paymentEntity) {
        await bookingService.recordPaymentFailure({
          bookingId,
          reason: paymentEntity.error_description || "Payment failed",
          eventId,
        });
      }
    } else if (eventType === "refund.processed") {
      console.log(`ℹ️ Refund processed for payment: ${eventPayload.payload?.refund?.entity?.payment_id}`);
    }

    // Razorpay requires a 200 OK response
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    // Return 200 so Razorpay does not retry faulty payloads indefinitely, or 500 on transient errors
    return res.status(200).json({ status: "error_handled", message: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
};
