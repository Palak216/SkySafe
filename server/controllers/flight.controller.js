const Flight = require("../models/Flight");

// ==============================
// Add New Flight
// ==============================
const addFlight = async (req, res) => {
    try {

        const {
            flightNumber,
            airline,
            source,
            destination,
            departureTime,
            arrivalTime,
            duration,
            price,
            totalSeats,
            availableSeats,
            aircraft,
            status
        } = req.body;

        // Check if flight already exists
        const existingFlight = await Flight.findOne({ flightNumber });

        if (existingFlight) {
            return res.status(400).json({
                success: false,
                message: "Flight already exists"
            });
        }

        // Create flight
        const flight = await Flight.create({
            flightNumber,
            airline,
            source,
            destination,
            departureTime,
            arrivalTime,
            duration,
            price,
            totalSeats,
            availableSeats,
            aircraft,
            status
        });

        res.status(201).json({
            success: true,
            message: "Flight added successfully",
            flight
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

module.exports = {
    addFlight,
    
};