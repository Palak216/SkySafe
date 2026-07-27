const Flight = require("../models/Flight");
const Booking = require("../models/Booking");

const bookFlight = async (req, res) => {
    try {

        const { flightId, passengers } = req.body;

        if (!passengers || passengers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one passenger is required"
            });
        }

        const seatsRequested = passengers.length;

        // Atomically reduce available seats
        const flight = await Flight.findOneAndUpdate(
            {
                _id: flightId,
                availableSeats: { $gte: seatsRequested }
            },
            {
                $inc: {
                    availableSeats: -seatsRequested
                }
            },
            {
                new: true
            }
        );

        if (!flight) {
            return res.status(400).json({
                success: false,
                message: "Not enough seats available"
            });
        }

        const bookingRef = `SKY-${Date.now().toString(36).toUpperCase()}`;

        const booking = await Booking.create({
            user: req.user.id,
            flight: flightId,
            passengers,
            seatsBooked: seatsRequested,
            totalPrice: flight.price * seatsRequested,
            bookingRef,
        });

        res.status(201).json({
            success: true,
            message: "Booking confirmed",
            booking,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
        user: req.user.id
});

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
module.exports = {
    bookFlight,
};