const express = require("express");
const {
  createOrder,
  verifyPayment,
  handleWebhook,
  mockPay,
} = require("../controllers/payment.controller");
const requireAuth = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createOrderSchema,
  verifyPaymentSchema,
} = require("../validations/payment.validation");

const router = express.Router();

// Webhook endpoint (Raw body signature verified, no user auth)
router.post("/webhook", handleWebhook);

// Protected payment endpoints
router.post("/create-order", requireAuth, validate(createOrderSchema), createOrder);
router.post("/verify", requireAuth, validate(verifyPaymentSchema), verifyPayment);

// Local demo only: the controller returns 404 unless PAYMENT_MODE=mock
// (and never in production). It takes { bookingId }, the same body as create-order.
router.post("/mock-pay", requireAuth, validate(createOrderSchema), mockPay);

module.exports = router;