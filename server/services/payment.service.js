const crypto = require("crypto");
const Razorpay = require("razorpay");
const env = require("../config/env");
const AppError = require("../utils/AppError");

let razorpayInstance = null;

/** Mock mode is for local demos only and is refused in production. */
const isMockMode = () =>
  process.env.PAYMENT_MODE === "mock" && process.env.NODE_ENV !== "production";

const getKeySecret = () =>
  env.RAZORPAY_KEY_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  (isMockMode() ? "mock_key_secret" : undefined);

/** Simulates what Razorpay Checkout returns after a successful payment. */
const generateMockPayment = (orderId) => {
  const paymentId = `pay_mock_${crypto.randomBytes(7).toString("hex")}`;
  const signature = crypto
    .createHmac("sha256", getKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  };
};

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
 * Create a Razorpay Order (or a simulated one in mock mode)
 */
const createOrder = async ({ bookingId, amountInPaise, currency = "INR", notes = {} }) => {
  if (isMockMode()) {
    return {
      id: `order_mock_${crypto.randomBytes(7).toString("hex")}`,
      amount: Math.round(amountInPaise),
      currency,
      receipt: `bkg_${bookingId.toString().slice(-14)}`,
      status: "created",
    };
  }

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
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const keySecret = getKeySecret();
  if (!keySecret) return false;

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
 * Issue a Refund through Razorpay API (or a simulated one in mock mode)
 */
const processRefund = async ({ paymentId, amountInPaise, notes = {} }) => {
  if (isMockMode()) {
    return {
      id: `rfnd_mock_${crypto.randomBytes(7).toString("hex")}`,
      payment_id: paymentId,
      amount: amountInPaise,
      status: "processed",
    };
  }

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
  isMockMode,
  generateMockPayment,
};