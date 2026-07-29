const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        flight: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Flight",
            required: true,
        },
        passengers: [
            {
                name: { type: String, required: true },
                age: { type: Number, required: true },
                gender: {
                    type: String,
                    enum: ["M", "F", "O"],
                    required: true,
                },
                seatNumber: {
                    type: String,
                },
            },
        ],
        seatsBooked: {
            type: Number,
            required: true,
            min: 1,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Confirmed", "Cancelled"],
            default: "Confirmed",
        },
        bookingRef: {
            type: String,
            unique: true,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Booking", bookingSchema);