const express = require("express");
const {
  getFlights,
  searchFlights,
  searchFlightsNL,
  getFlightById,
  addFlight,
  updateFlight,
  deleteFlight,
} = require("../controllers/flight.controller");
const { prepareFlightForBooking } = require("../controllers/aiFlight.controller");
const requireAuth = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/admin.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createFlightSchema,
  updateFlightSchema,
  flightIdParamSchema,
  searchFlightsQuerySchema,
} = require("../validations/flight.validation");

const router = express.Router();

// ==============================
// Public Routes
// ==============================

// Search & List Flights with filters, pagination, sorting
router.get("/", validate(searchFlightsQuerySchema), getFlights);
router.get("/search", validate(searchFlightsQuerySchema), searchFlights);

// Natural Language Flight Search (Phase 7)
router.post("/nl-search", searchFlightsNL);

// Bridge endpoint connecting external/mock search results to SkySafe MongoDB
router.post("/bridge-or-prepare", prepareFlightForBooking);

// Get Single Flight
router.get("/:id", validate(flightIdParamSchema), getFlightById);

// ==============================
// Admin-Only Routes
// ==============================

// Create Flight
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(createFlightSchema),
  addFlight
);

// Update Flight
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateFlightSchema),
  updateFlight
);

// Delete Flight
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(flightIdParamSchema),
  deleteFlight
);

module.exports = router;
