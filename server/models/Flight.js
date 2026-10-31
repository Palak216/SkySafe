const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: [true, "Flight number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    airline: {
      type: String,
      required: [true, "Airline is required"],
      trim: true,
    },
    origin: {
      type: String,
      required: [true, "Origin IATA code is required"],
      trim: true,
      uppercase: true,
      minlength: [3, "IATA code must be 3 characters"],
      maxlength: [3, "IATA code must be 3 characters"],
      match: [/^[A-Z]{3}$/, "Origin must be a 3-letter IATA code"],
    },
    destination: {
      type: String,
      required: [true, "Destination IATA code is required"],
      trim: true,
      uppercase: true,
      minlength: [3, "IATA code must be 3 characters"],
      maxlength: [3, "IATA code must be 3 characters"],
      match: [/^[A-Z]{3}$/, "Destination must be a 3-letter IATA code"],
    },
    departureTime: {
      type: Date,
      required: [true, "Departure time is required"],
    },
    arrivalTime: {
      type: Date,
      required: [true, "Arrival time is required"],
      validate: {
        validator: function (value) {
          if (!this.departureTime || !value) return true;
          return new Date(value) > new Date(this.departureTime);
        },
        message: "Arrival time must be strictly after departure time",
      },
    },
    duration: {
      type: String,
      default: function () {
        if (this.departureTime && this.arrivalTime) {
          const diffMs = new Date(this.arrivalTime) - new Date(this.departureTime);
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          return `${hours}h ${mins}m`;
        }
        return "2h 30m";
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    totalSeats: {
      type: Number,
      required: [true, "Total seats is required"],
      min: [1, "Total seats must be at least 1"],
    },
    availableSeats: {
      type: Number,
      required: [true, "Available seats is required"],
      min: [0, "Available seats cannot be negative"],
      validate: {
        validator: function (value) {
          if (this.totalSeats === undefined || value === undefined) return true;
          return value <= this.totalSeats;
        },
        message: "Available seats cannot exceed total seats",
      },
    },
    aircraft: {
      type: String,
      default: "Airbus A320",
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["SCHEDULED", "DELAYED", "CANCELLED"],
        message: "{VALUE} is not a valid flight status",
      },
      default: "SCHEDULED",
      uppercase: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias: source -> origin (for backward compatibility)
flightSchema.virtual("source").get(function () {
  return this.origin;
}).set(function (val) {
  this.origin = val;
});

// Compound index on { origin, destination, departureTime }
flightSchema.index({ origin: 1, destination: 1, departureTime: 1 });

// Ensure availableSeats <= totalSeats on updates
flightSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update && update.$set && update.$set.status) {
    update.$set.status = update.$set.status.toUpperCase();
  }
  next();
});

const Flight = mongoose.model("Flight", flightSchema);

module.exports = Flight;
