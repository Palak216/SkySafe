/**
 * AI Flight Search Controller
 *
 * Handles natural language search requests:
 * 1. AI / NLP query parsing
 * 2. Strict backend business rule validation
 * 3. Flight Provider querying (Amadeus Test API / Mock Provider)
 * 4. Deterministic custom ranking & scoring
 */

const { parseFlightQuery } = require("../services/aiFlightHelper");
const { validateParsedQuery } = require("../services/queryValidator");
const flightProvider = require("../services/flightProviders");
const rankingService = require("../services/rankingService");
const Flight = require("../models/Flight");

/**
 * Natural language flight search endpoint
 * POST /api/ai/flights/search
 */
const searchFlightsAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please enter a travel query (e.g. 'Find me a cheap flight from Delhi to Goa tomorrow').",
      });
    }

    // 1. AI / NLP query parsing
    const parsedQuery = await parseFlightQuery(message.trim());

    // 2. Strict backend validation
    const validation = validateParsedQuery(parsedQuery);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
        query: parsedQuery,
      });
    }

    const sanitized = validation.sanitizedQuery;

    // 3. Query flight provider (Amadeus or Mock fallback)
    const providerResult = await flightProvider.searchFlights(sanitized);

    // 4. Custom ranking layer
    const rankedFlights = rankingService.rankFlights(providerResult.flights, sanitized);

    return res.status(200).json({
      success: true,
      provider: providerResult.providerUsed,
      isFallback: providerResult.isFallback,
      fallbackReason: providerResult.fallbackReason || null,
      query: sanitized,
      count: rankedFlights.length,
      flights: rankedFlights,
    });
  } catch (error) {
    console.error("AI Flight Search Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while searching for flights. Please try again.",
    });
  }
};

/**
 * Bridge endpoint connecting external/mock search results to SkySafe's MongoDB booking system
 * POST /api/flights/bridge-or-prepare
 */
const prepareFlightForBooking = async (req, res) => {
  try {
    const { flight } = req.body;

    if (!flight || !flight.flightNumber || !flight.departureTime) {
      return res.status(400).json({
        success: false,
        message: "Flight details are required for booking preparation.",
      });
    }

    const departureTime = new Date(flight.departureTime);

    // Check if flight already exists in MongoDB
    let dbFlight = await Flight.findOne({
      flightNumber: flight.flightNumber,
      departureTime,
    });

    if (!dbFlight) {
      // Create new record in MongoDB
      dbFlight = await Flight.create({
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        source: flight.source,
        destination: flight.destination,
        departureTime,
        arrivalTime: new Date(flight.arrivalTime),
        duration: flight.duration || "2h 30m",
        price: Number(flight.price),
        totalSeats: flight.totalSeats || 180,
        availableSeats: flight.availableSeats || 180,
        aircraft: flight.aircraft || "Airbus A320",
        status: "Scheduled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Flight prepared for booking",
      flightId: dbFlight._id,
      flight: dbFlight,
    });
  } catch (error) {
    console.error("Prepare Flight Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to prepare flight for booking.",
    });
  }
};

module.exports = {
  searchFlightsAI,
  prepareFlightForBooking,
};
