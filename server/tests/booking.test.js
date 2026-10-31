const request = require("supertest");
const app = require("../app");
const Flight = require("../models/Flight");
const Booking = require("../models/Booking");
const User = require("../models/User");

describe("Booking System Suite", () => {
  let userToken;
  let otherUserToken;
  let flight;

  beforeEach(async () => {
    const user1 = await User.create({
      name: "Alice Traveler",
      email: "alice@test.com",
      password: "Password123!",
      role: "user",
    });
    const res1 = await request(app).post("/api/auth/login").send({
      email: "alice@test.com",
      password: "Password123!",
    });
    userToken = res1.body.data.token;

    const user2 = await User.create({
      name: "Bob Traveler",
      email: "bob@test.com",
      password: "Password123!",
      role: "user",
    });
    const res2 = await request(app).post("/api/auth/login").send({
      email: "bob@test.com",
      password: "Password123!",
    });
    otherUserToken = res2.body.data.token;

    const dep = new Date(Date.now() + 86400000 * 2);
    const arr = new Date(dep.getTime() + 7200000);
    flight = await Flight.create({
      flightNumber: "TEST-BOOK",
      airline: "IndiGo",
      origin: "DEL",
      destination: "BOM",
      departureTime: dep,
      arrivalTime: arr,
      price: 5000,
      totalSeats: 10,
      availableSeats: 10,
      status: "SCHEDULED",
    });
  });

  it("should atomically reserve seats and create booking as PENDING_PAYMENT with 10-min expiry", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        flightId: flight._id.toString(),
        passengers: [
          { name: "Alice", age: 29, gender: "F" },
          { name: "Charlie", age: 31, gender: "M" },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const booking = res.body.data;
    expect(booking.status).toBe("PENDING_PAYMENT");
    expect(booking.seatsBooked).toBe(2);
    expect(booking.totalAmount).toBe(10000);
    expect(booking.pnr).toBeDefined();
    expect(booking.pnr.length).toBe(6);

    // Verify seats were decremented from 10 to 8
    const updatedFlight = await Flight.findById(flight._id);
    expect(updatedFlight.availableSeats).toBe(8);

    // Expiry should be approx 10 minutes in future
    const expiryDiffMs = new Date(booking.expiresAt).getTime() - Date.now();
    expect(expiryDiffMs).toBeGreaterThan(9 * 60 * 1000);
    expect(expiryDiffMs).toBeLessThanOrEqual(10 * 60 * 1000 + 5000);
  });

  it("should prevent unauthorized users from cancelling someone else's booking", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        flightId: flight._id.toString(),
        passengers: [{ name: "Alice", age: 29, gender: "F" }],
      });
    const bookingId = res.body.data._id;

    // Bob tries to cancel Alice's booking
    const unauthorizedCancel = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${otherUserToken}`)
      .send({ reason: "Malicious cancel" });

    expect(unauthorizedCancel.status).toBe(403);

    // Seats should remain decremented
    const f = await Flight.findById(flight._id);
    expect(f.availableSeats).toBe(9);
  });

  it("should restore seats on cancellation idempotently without adding seats twice", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        flightId: flight._id.toString(),
        passengers: [
          { name: "Alice", age: 29, gender: "F" },
          { name: "Charlie", age: 31, gender: "M" },
        ],
      });
    const bookingId = res.body.data._id;
    expect((await Flight.findById(flight._id)).availableSeats).toBe(8);

    // First cancel -> 200 OK
    const cancel1 = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "Cancel once" });
    expect(cancel1.status).toBe(200);

    // Seats restored to 10
    expect((await Flight.findById(flight._id)).availableSeats).toBe(10);

    // Second cancel attempt -> 400 Bad Request
    const cancel2 = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ reason: "Cancel twice" });
    expect(cancel2.status).toBe(400);

    // Seats must NOT increase again to 12!
    expect((await Flight.findById(flight._id)).availableSeats).toBe(10);
  });
});
