const request = require("supertest");
const app = require("../app");
const Flight = require("../models/Flight");
const Booking = require("../models/Booking");
const User = require("../models/User");

describe("High Concurrency Race-Condition Test", () => {
  it("should handle 20 parallel bookings on a 5-seat flight, selling exactly 5 and never going negative", async () => {
    // 1. Create flight with EXACTLY 5 available seats
    const dep = new Date(Date.now() + 86400000);
    const arr = new Date(dep.getTime() + 7200000);

    const flight = await Flight.create({
      flightNumber: "CONCUR-5",
      airline: "IndiGo",
      origin: "DEL",
      destination: "BOM",
      departureTime: dep,
      arrivalTime: arr,
      price: 3500,
      totalSeats: 5,
      availableSeats: 5,
      status: "SCHEDULED",
    });

    // 2. Create user for authentication
    await User.create({
      name: "Concurrent Traveler",
      email: "concurrent@test.com",
      password: "Password123!",
      role: "user",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "concurrent@test.com",
      password: "Password123!",
    });
    const token = loginRes.body.data.token;

    // 3. Fire 20 parallel booking requests at the flight simultaneously
    const requests = Array.from({ length: 20 }, (_, idx) => {
      return request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          flightId: flight._id.toString(),
          passengers: [{ name: `Traveler ${idx + 1}`, age: 25, gender: "M" }],
        });
    });

    const responses = await Promise.all(requests);

    // 4. Analyze results
    const successfulBookings = responses.filter((r) => r.status === 201);
    const failedBookings = responses.filter(
      (r) => r.status === 400 && r.body.message.includes("Not enough seats")
    );

    console.log(`Concurrency Results: ${successfulBookings.length} succeeded, ${failedBookings.length} rejected.`);

    // EXACTLY 5 bookings must succeed
    expect(successfulBookings.length).toBe(5);

    // EXACTLY 15 bookings must be rejected due to lack of seats
    expect(failedBookings.length).toBe(15);

    // 5. Verify final database state
    const finalFlight = await Flight.findById(flight._id);
    expect(finalFlight.availableSeats).toBe(0);
    expect(finalFlight.availableSeats).not.toBeLessThan(0); // Never negative!

    // Verify exactly 5 booking documents were created in MongoDB
    const totalBookingsCreated = await Booking.countDocuments({ flight: flight._id });
    expect(totalBookingsCreated).toBe(5);
  });
});
