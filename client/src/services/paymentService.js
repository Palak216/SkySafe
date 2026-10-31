import api from "./api";

/**
 * Dynamically inject Razorpay Checkout SDK script
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay Order from server
 */
export const createPaymentOrder = async (bookingId) => {
  const response = await api.post("/payments/create-order", { bookingId });
  return response.data;
};

/**
 * Verify Razorpay payment signature on backend
 */
export const verifyPayment = async ({
  bookingId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const response = await api.post("/payments/verify", {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return response.data;
};

/**
 * Mock mode only: asks the server for a simulated (validly signed) payment
 */
export const createMockPayment = async (bookingId) => {
  const response = await api.post("/payments/mock-pay", { bookingId });
  return response.data;
};