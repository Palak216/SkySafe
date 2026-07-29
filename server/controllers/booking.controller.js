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
            user: req.user.id,
        })
        .populate(
            "flight",
            "flightNumber airline source destination departureTime arrivalTime"
        )
        .sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};
const cancelBooking = async (req, res) => {
    try {

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to cancel this booking",
            });
        }

        if (booking.status === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled",
            });
        }

        booking.status = "Cancelled";
        await booking.save();

        await Flight.findByIdAndUpdate(
            booking.flight,
            {
                $inc: {
                    availableSeats: booking.seatsBooked,
                },
            }
        );

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};
module.exports = {
    bookFlight,
    getMyBookings,
    cancelBooking,
};