const express = require("express");
const {
  createOrder,
  verifyPayment,
  handleWebhook,
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

module.exports = router;
