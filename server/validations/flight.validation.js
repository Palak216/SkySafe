const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createFlightSchema = {
  body: z
    .object({
      flightNumber: z.string().min(2).max(20).trim().toUpperCase(),
      airline: z.string().min(2).max(50).trim(),
      origin: z.string().length(3, "Origin must be 3-letter IATA code").trim().toUpperCase(),
      destination: z.string().length(3, "Destination must be 3-letter IATA code").trim().toUpperCase(),
      departureTime: z.string().datetime({ message: "Invalid departureTime ISO format" }),
      arrivalTime: z.string().datetime({ message: "Invalid arrivalTime ISO format" }),
      price: z.number().nonnegative("Price must be >= 0"),
      totalSeats: z.number().int().positive("Total seats must be > 0"),
      availableSeats: z.number().int().nonnegative().optional(),
      aircraft: z.string().optional().default("Airbus A320"),
      status: z.enum(["SCHEDULED", "DELAYED", "CANCELLED"]).optional().default("SCHEDULED"),
    })
    .refine((data) => new Date(data.arrivalTime) > new Date(data.departureTime), {
      message: "arrivalTime must be after departureTime",
      path: ["arrivalTime"],
    })
    .refine((data) => data.origin !== data.destination, {
      message: "origin and destination cannot be identical",
      path: ["destination"],
    })
    .refine(
      (data) =>
        data.availableSeats === undefined || data.availableSeats <= data.totalSeats,
      {
        message: "availableSeats cannot exceed totalSeats",
        path: ["availableSeats"],
      }
    ),
};

const updateFlightSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid flight ID format"),
  }),
  body: z
    .object({
      flightNumber: z.string().min(2).max(20).trim().toUpperCase().optional(),
      airline: z.string().min(2).max(50).trim().optional(),
      origin: z.string().length(3).trim().toUpperCase().optional(),
      destination: z.string().length(3).trim().toUpperCase().optional(),
      departureTime: z.string().datetime().optional(),
      arrivalTime: z.string().datetime().optional(),
      price: z.number().nonnegative().optional(),
      totalSeats: z.number().int().positive().optional(),
      availableSeats: z.number().int().nonnegative().optional(),
      aircraft: z.string().optional(),
      status: z.enum(["SCHEDULED", "DELAYED", "CANCELLED"]).optional(),
    })
    .refine(
      (data) => {
        if (data.departureTime && data.arrivalTime) {
          return new Date(data.arrivalTime) > new Date(data.departureTime);
        }
        return true;
      },
      {
        message: "arrivalTime must be after departureTime",
        path: ["arrivalTime"],
      }
    ),
};

const flightIdParamSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid flight ID format"),
  }),
};

const searchFlightsQuerySchema = {
  query: z.object({
    from: z.string().trim().toUpperCase().optional(),
    to: z.string().trim().toUpperCase().optional(),
    source: z.string().trim().toUpperCase().optional(), // Support legacy alias
    destination: z.string().trim().toUpperCase().optional(),
    date: z.string().optional(), // YYYY-MM-DD
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    airline: z.string().trim().optional(),
    sortBy: z.enum(["price", "departureTime", "duration", "airline"]).optional().default("price"),
    order: z.enum(["asc", "desc"]).optional().default("asc"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    status: z.enum(["SCHEDULED", "DELAYED", "CANCELLED"]).optional(),
  }),
};

module.exports = {
  createFlightSchema,
  updateFlightSchema,
  flightIdParamSchema,
  searchFlightsQuerySchema,
};
