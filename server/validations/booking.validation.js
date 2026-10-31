const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const passengerValidation = z.object({
  name: z.string().min(2, "Passenger name must be at least 2 characters").max(100).trim(),
  age: z.coerce.number().int().min(1, "Age must be at least 1").max(120, "Age cannot exceed 120"),
  gender: z.enum(["M", "F", "O"], {
    errorMap: () => ({ message: "Gender must be 'M', 'F', or 'O'" }),
  }),
  seatNumber: z.string().trim().optional(),
});

const createBookingSchema = {
  body: z.object({
    flightId: z.string().regex(objectIdRegex, "Invalid flight ID format"),
    passengers: z
      .array(passengerValidation)
      .min(1, "Booking requires at least one passenger")
      .max(9, "Maximum 9 passengers per booking"),
  }),
};

const bookingIdParamSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid booking ID format"),
  }),
};

const cancelBookingSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid booking ID format"),
  }),
  body: z
    .object({
      reason: z.string().max(200).optional(),
    })
    .optional(),
};

const listBookingsQuerySchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(10),
    status: z.enum(["PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "EXPIRED"]).optional(),
  }),
};

module.exports = {
  createBookingSchema,
  bookingIdParamSchema,
  cancelBookingSchema,
  listBookingsQuerySchema,
};
