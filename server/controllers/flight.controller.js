const Flight = require("../models/Flight");

// ==============================
// Add Flight
// ==============================
const addFlight = async (req, res) => {
    try {

        const existingFlight = await Flight.findOne({
            flightNumber: req.body.flightNumber,
        });

        if (existingFlight) {
            return res.status(400).json({
                success: false,
                message: "Flight already exists",
            });
        }

        const flight = await Flight.create(req.body);

        res.status(201).json({
            success: true,
            message: "Flight added successfully",
            flight,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// ==============================
// Get All Flights
// ==============================
const getAllFlights = async (req, res) => {
    try {

        const flights = await Flight.find();

        res.status(200).json({
            success: true,
            count: flights.length,
            flights,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};
// ==============================
// Get Flight By ID
// ==============================
const getFlightById = async (req, res) => {
    try {

        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: "Flight not found"
            });
        }

        res.status(200).json({
            success: true,
            flight
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};// ==============================
// Update Flight
// ==============================
const updateFlight = async (req, res) => {
    try {

        const flight = await Flight.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: "Flight not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Flight updated successfully",
            flight
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
// ==============================
// Delete Flight
// ==============================
const deleteFlight = async (req, res) => {
    try {

        const flight = await Flight.findById(req.params.id);

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: "Flight not found"
            });
        }

        await flight.deleteOne();

        res.status(200).json({
            success: true,
            message: "Flight deleted successfully"
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
    getAllFlights,
    getFlightById,
    updateFlight,
    deleteFlight
};