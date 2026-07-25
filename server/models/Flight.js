const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
    {
        flightNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        airline: {
            type: String,
            required: true,
            trim: true,
        },

        source: {
            type: String,
            required: true,
            trim: true,
        },

        destination: {
            type: String,
            required: true,
            trim: true,
        },

        departureTime: {
            type: Date,
            required: true,
        },

        arrivalTime: {
            type: Date,
            required: true,
        },

        duration: {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },

        totalSeats: {
            type: Number,
            required: true,
        },

        availableSeats: {
            type: Number,
            required: true,
        },

        aircraft: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["Scheduled", "Delayed", "Cancelled"],
            default: "Scheduled",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Flight", flightSchema);