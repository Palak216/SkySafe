const Flight = require("../models/Flight");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { expireOverdueBookings } = require("../jobs/bookingExpiry.job");

describe("Booking Expiry Job Suite", () => {
  it("should sweep expired bookings, mark them EXPIRED, and restore seats idempotently", async () => {
    // 1. Create flight with 10 total and 7 available seats
    const dep = new Date(Date.now() + 86400000);
    const arr = new Date(dep.getTime() + 7200000);

    const flight = await Flight.create({
      flightNumber: "EXP-101",
      airline: "IndiGo",
      origin: "DEL",
      destination: "GOI",
      departureTime: dep,
      arrivalTime: arr,
      price: 4500,
      totalSeats: 10,
      availableSeats: 7, // 3 seats reserved
      status: "SCHEDULED",
    });

    const user = await User.create({
      name: "Late Payer",
      email: "late@test.com",
      password: "Password123!",
      role: "user",
    });

    // 2. Create overdue booking that expired 5 minutes ago
    const expiredBooking = await Booking.create({
      user: user._id,
      flight: flight._id,
      passengers: [
        { name: "P1", age: 30, gender: "M" },
        { name: "P2", age: 25, gender: "F" },
        { name: "P3", age: 10, gender: "M" },
      ],
      seatsBooked: 3,
      totalAmount: 13500,
      status: "PENDING_PAYMENT",
      expiresAt: new Date(Date.now() - 5 * 60 * 1000), // in the past
    });

    // 3. Run expiry job
    const result1 = await expireOverdueBookings();
    expect(result1.expiredCount).toBe(1);
    expect(result1.restoredSeats).toBe(3);

    // Verify booking is marked EXPIRED
    const b1 = await Booking.findById(expiredBooking._id);
    expect(b1.status).toBe("EXPIRED");

    // Verify seats restored from 7 to 10
    const f1 = await Flight.findById(flight._id);
    expect(f1.availableSeats).toBe(10);

    // 4. Run second sweep immediately (Idempotency test)
    const result2 = await expireOverdueBookings();
    expect(result2.expiredCount).toBe(0);
    expect(result2.restoredSeats).toBe(0);

    // Seats must strictly remain 10 (not 13!)
    const f2 = await Flight.findById(flight._id);
    expect(f2.availableSeats).toBe(10);
  });
});
