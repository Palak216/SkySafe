const crypto = require("crypto");
const Razorpay = require("razorpay");
const env = require("../config/env");
const AppError = require("../utils/AppError");

let razorpayInstance = null;

/**
 * Get or initialize the Razorpay client singleton
 */
function getRazorpayClient() {
  if (!razorpayInstance) {
    const keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new AppError("Razorpay credentials are not configured", 500);
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

/**
 * Create a Razorpay Order
 * @param {Object} params
 * @param {string} params.bookingId - SkySafe Booking ID for receipt
 * @param {number} params.amountInPaise - Order amount in smallest currency unit (paise)
 * @param {string} [params.currency="INR"]
 * @param {Object} [params.notes]
 * @returns {Promise<Object>} Razorpay Order
 */
const createOrder = async ({ bookingId, amountInPaise, currency = "INR", notes = {} }) => {
  const rzp = getRazorpayClient();

  try {
    const order = await rzp.orders.create({
      amount: Math.round(amountInPaise),
      currency,
      receipt: `bkg_${bookingId.toString().slice(-14)}`,
      notes: {
        bookingId: bookingId.toString(),
        ...notes,
      },
    });

    return order;
  } catch (err) {
    console.error("Razorpay Order Creation Failed:", err);
    throw new AppError(err.error?.description || err.message || "Failed to create payment order", 502);
  }
};

/**
 * Timing-safe HMAC SHA256 Signature Verification for Payment Checkouts
 * @param {Object} params
 * @param {string} params.orderId - razorpay_order_id
 * @param {string} params.paymentId - razorpay_payment_id
 * @param {string} params.signature - razorpay_signature
 * @returns {boolean}
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
  const payload = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

/**
 * Timing-safe HMAC SHA256 Signature Verification for Webhooks
 * @param {Buffer|string} rawBody - Raw unparsed request body buffer or string
 * @param {string} signature - Header 'x-razorpay-signature'
 * @returns {boolean}
 */
const verifyWebhookSignature = (rawBody, signature) => {
  if (!rawBody || !signature) {
    return false;
  }

  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(bodyBuffer)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

/**
 * Issue a Refund through Razorpay API
 * @param {Object} params
 * @param {string} params.paymentId - razorpay_payment_id
 * @param {number} [params.amountInPaise] - Optional partial amount in paise (omit for full)
 * @param {Object} [params.notes]
 * @returns {Promise<Object>} Razorpay Refund Object
 */
const processRefund = async ({ paymentId, amountInPaise, notes = {} }) => {
  const rzp = getRazorpayClient();

  try {
    const refundData = {
      notes: {
        source: "SkySafe Cancellation",
        ...notes,
      },
    };

    if (amountInPaise && amountInPaise > 0) {
      refundData.amount = Math.round(amountInPaise);
    }

    const refund = await rzp.payments.refund(paymentId, refundData);
    return refund;
  } catch (err) {
    console.error("Razorpay Refund Failed:", err);
    throw new AppError(err.error?.description || err.message || "Failed to process refund", 502);
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  processRefund,
  getRazorpayClient,
};
