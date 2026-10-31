const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Generate a unique 6-character alphanumeric PNR
 * Excludes easily confusable characters (I, O, 0, 1)
 */
function generatePNR() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pnr = "";
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    pnr += chars[randomBytes[i] % chars.length];
  }
  return pnr;
}

const passengerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Passenger name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    age: {
      type: Number,
      required: [true, "Passenger age is required"],
      min: [1, "Age must be at least 1"],
      max: [120, "Age cannot exceed 120"],
    },
    gender: {
      type: String,
      enum: {
        values: ["M", "F", "O"],
        message: "Gender must be 'M', 'F', or 'O'",
      },
      required: [true, "Gender is required"],
      uppercase: true,
    },
    seatNumber: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
    },
    refundStatus: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: [true, "Flight is required"],
      index: true,
    },
    passengers: {
      type: [passengerSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: "Booking must include at least one passenger",
      },
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: [1, "At least 1 seat must be booked"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    totalPrice: {
      type: Number,
      default: function () {
        return this.totalAmount;
      },
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"],
        message: "{VALUE} is not a valid booking status",
      },
      default: "PENDING_PAYMENT",
      index: true,
    },
    pnr: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
      default: generatePNR,
    },
    bookingRef: {
      type: String,
      unique: true,
      sparse: true,
      default: function () {
        return this.pnr;
      },
    },
    payment: {
      type: paymentSchema,
      default: () => ({}),
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes TTL window
      index: true,
    },
    // Deduplication of processed webhook event IDs
    processedWebhookEvents: {
      type: [String],
      default: [],
    },
    cancellation: {
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      refundAmount: Number,
      refundStatus: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to keep pnr & bookingRef in sync
bookingSchema.pre("save", function (next) {
  if (this.pnr && !this.bookingRef) {
    this.bookingRef = this.pnr;
  }
  if (this.totalAmount && !this.totalPrice) {
    this.totalPrice = this.totalAmount;
  }
  next();
});

// Indexes for high performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ flight: 1, status: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
module.exports.generatePNR = generatePNR;
