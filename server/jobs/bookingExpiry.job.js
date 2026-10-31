const cron = require("node-cron");
const Booking = require("../models/Booking");
const Flight = require("../models/Flight");

/**
 * Sweeps for expired PENDING_PAYMENT bookings, marks them EXPIRED,
 * and atomically restores the reserved flight seats.
 * Completely idempotent: if run concurrently, each booking is processed exactly once.
 * @returns {Promise<{ expiredCount: number, restoredSeats: number }>}
 */
async function expireOverdueBookings() {
  try {
    const now = new Date();

    // Find bookings that have exceeded their reservation expiry window
    const overdueBookings = await Booking.find({
      status: "PENDING_PAYMENT",
      expiresAt: { $lt: now },
    });

    if (overdueBookings.length === 0) {
      return { expiredCount: 0, restoredSeats: 0 };
    }

    let expiredCount = 0;
    let restoredSeats = 0;

    for (const booking of overdueBookings) {
      // Atomically mark EXPIRED only if still PENDING_PAYMENT
      const updated = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          status: "PENDING_PAYMENT",
        },
        {
          $set: { status: "EXPIRED" },
        },
        { new: true }
      );

      // If updated is not null, this job was the exclusive owner of the transition
      if (updated) {
        expiredCount++;
        restoredSeats += updated.seatsBooked;

        // Atomically restore available seats on the flight
        await Flight.findByIdAndUpdate(updated.flight, {
          $inc: { availableSeats: updated.seatsBooked },
        });

        console.log(
          `⏱️ [EXPIRED] Booking ${updated.pnr} expired. Restored ${updated.seatsBooked} seats to flight.`
        );
      }
    }

    return { expiredCount, restoredSeats };
  } catch (error) {
    console.error("❌ Error running booking expiry job:", error.message);
    return { expiredCount: 0, restoredSeats: 0 };
  }
}

/**
 * Start the background cron job (runs every minute: '* * * * *')
 */
function startExpiryJob() {
  // Only start cron if not in test environment
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  const job = cron.schedule("* * * * *", async () => {
    await expireOverdueBookings();
  });

  console.log("⏱️ Booking reservation expiry cron job scheduled (every minute).");
  return job;
}

module.exports = {
  startExpiryJob,
  expireOverdueBookings,
};
