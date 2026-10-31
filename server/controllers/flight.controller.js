const flightService = require("../services/flight.service");
const { searchFlightsNaturalLanguage } = require("../services/nlSearch.service");

/**
 * Get All / Search Flights
 * GET /api/flights?from=&to=&date=&minPrice=&maxPrice=&airline=&sortBy=&order=&page=&limit=
 */
const getFlights = async (req, res, next) => {
  try {
    const result = await flightService.searchFlights(req.query);

    return res.status(200).json({
      success: true,
      count: result.flights.length,
      data: result,
      flights: result.flights,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search Flights (Alias endpoint for /api/flights/search)
 * GET /api/flights/search
 */
const searchFlights = async (req, res, next) => {
  try {
    const result = await flightService.searchFlights(req.query);

    return res.status(200).json({
      success: true,
      count: result.flights.length,
      data: result,
      flights: result.flights,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Natural Language Flight Search
 * POST /api/flights/nl-search
 */
const searchFlightsNL = async (req, res, next) => {
  try {
    const { query, message } = req.body;
    const textToSearch = query || message;

    const result = await searchFlightsNaturalLanguage(textToSearch);

    return res.status(200).json({
      success: true,
      message: "Natural language query parsed successfully",
      extracted: result.extracted,
      count: result.flights.length,
      data: result,
      flights: result.flights,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Flight By ID
 * GET /api/flights/:id
 */
const getFlightById = async (req, res, next) => {
  try {
    const flight = await flightService.getFlightById(req.params.id);

    return res.status(200).json({
      success: true,
      data: flight,
      flight,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add New Flight (Admin only)
 * POST /api/flights
 */
const addFlight = async (req, res, next) => {
  try {
    const flight = await flightService.createFlight(req.body);

    return res.status(201).json({
      success: true,
      message: "Flight added successfully",
      data: flight,
      flight,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Flight (Admin only)
 * PUT /api/flights/:id
 */
const updateFlight = async (req, res, next) => {
  try {
    const flight = await flightService.updateFlight(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Flight updated successfully",
      data: flight,
      flight,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Flight (Admin only)
 * DELETE /api/flights/:id
 */
const deleteFlight = async (req, res, next) => {
  try {
    await flightService.deleteFlight(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Flight deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFlights,
  getAllFlights: getFlights,
  searchFlights,
  searchFlightsNL,
  getFlightById,
  addFlight,
  updateFlight,
  deleteFlight,
};
