const request = require("supertest");
const crypto = require("crypto");
const app = require("../app");
const Flight = require("../models/Flight");
const Booking = require("../models/Booking");
const User = require("../models/User");

describe("Razorpay Payment & Webhook Suite", () => {
  let userToken;
  let flight;
  let booking;

  beforeEach(async () => {
    const user = await User.create({
      name: "Payment Tester",
      email: "paytest@test.com",
      password: "Password123!",
      role: "user",
    });
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "paytest@test.com",
      password: "Password123!",
    });
    userToken = loginRes.body.data.token;

    const dep = new Date(Date.now() + 86400000);
    const arr = new Date(dep.getTime() + 7200000);
    flight = await Flight.create({
      flightNumber: "PAY-101",
      airline: "IndiGo",
      origin: "DEL",
      destination: "BOM",
      departureTime: dep,
      arrivalTime: arr,
      price: 4000,
      totalSeats: 100,
      availableSeats: 100,
      status: "SCHEDULED",
    });

    const bookRes = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        flightId: flight._id.toString(),
        passengers: [{ name: "Payer", age: 30, gender: "M" }],
      });
    booking = bookRes.body.data;
  });

  it("should verify payment signature using HMAC SHA256 timing-safe comparison", async () => {
    const orderId = "order_test_12345";
    const paymentId = "pay_test_67890";
    const keySecret = require("../config/env").RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // 1. Invalid signature should be rejected with 400
    const badVerify = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        bookingId: booking._id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: "forged_invalid_signature_hex",
      });
    expect(badVerify.status).toBe(400);
    expect(badVerify.body.success).toBe(false);

    // 2. Valid signature should confirm booking
    const validSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const goodVerify = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        bookingId: booking._id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });
    expect(goodVerify.status).toBe(200);
    expect(goodVerify.body.success).toBe(true);
    expect(goodVerify.body.data.booking.status).toBe("CONFIRMED");
    expect(goodVerify.body.data.booking.payment.status).toBe("PAID");

    // 3. Duplicate verify call (idempotent)
    const dupVerify = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        bookingId: booking._id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });
    expect(dupVerify.status).toBe(200);
    expect(dupVerify.body.message).toContain("already confirmed");
  });

  it("should process webhook events idempotently and verify X-Razorpay-Signature", async () => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "rzp_test_mock_webhook_secret";
    const eventPayload = {
      event: "payment.captured",
      entity: { id: "evt_101" },
      payload: {
        payment: {
          entity: {
            id: "pay_hook_999",
            order_id: "order_hook_999",
            amount: 400000,
            status: "captured",
            notes: {
              bookingId: booking._id.toString(),
            },
          },
        },
      },
    };

    const rawBodyString = JSON.stringify(eventPayload);
    const validWebhookSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(Buffer.from(rawBodyString, "utf8"))
      .digest("hex");

    // 1. Send valid webhook
    const hookRes1 = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("X-Razorpay-Signature", validWebhookSig)
      .send(rawBodyString);

    expect(hookRes1.status).toBe(200);
    expect(hookRes1.body.status).toBe("ok");

    // Verify booking is confirmed in database
    const confirmedBooking = await Booking.findById(booking._id);
    expect(confirmedBooking.status).toBe("CONFIRMED");

    // 2. Replay webhook (idempotent replay)
    const hookRes2 = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("X-Razorpay-Signature", validWebhookSig)
      .send(rawBodyString);

    expect(hookRes2.status).toBe(200);
  });

  it("should automatically refund late payment when booking is already EXPIRED", async () => {
    // Force booking to EXPIRED state
    await Booking.findByIdAndUpdate(booking._id, {
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 3600000),
    });

    const orderId = "order_late_123";
    const paymentId = "pay_late_456";
    const keySecret = require("../config/env").RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;    const validSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const res = await request(app)
      .post("/api/payments/verify")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        bookingId: booking._id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.autoRefunded).toBe(true);

    const b = await Booking.findById(booking._id);
    expect(b.payment.status).toBe("REFUNDED");
  });
});
