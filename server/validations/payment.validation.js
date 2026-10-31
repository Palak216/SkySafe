const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createOrderSchema = {
  body: z.object({
    bookingId: z.string().regex(objectIdRegex, "Invalid booking ID format"),
  }),
};

const verifyPaymentSchema = {
  body: z.object({
    bookingId: z.string().regex(objectIdRegex, "Invalid booking ID format"),
    razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
    razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
    razorpay_signature: z.string().min(1, "razorpay_signature is required"),
  }),
};

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
};
