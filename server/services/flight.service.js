const Flight = require("../models/Flight");
const AppError = require("../utils/AppError");

/**
 * Search flights with filtering, sorting, and pagination
 * @param {Object} params
 * @param {string} [params.from] - Origin IATA code
 * @param {string} [params.to] - Destination IATA code
 * @param {string} [params.source] - Legacy origin alias
 * @param {string} [params.destination] - Destination alias
 * @param {string} [params.date] - Departure date in YYYY-MM-DD
 * @param {number} [params.minPrice] - Minimum price
 * @param {number} [params.maxPrice] - Maximum price
 * @param {string} [params.airline] - Airline name filter
 * @param {string} [params.sortBy="price"] - Sort field
 * @param {string} [params.order="asc"] - Sort order ('asc' | 'desc')
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Page size
 * @param {string} [params.status] - Flight status
 * @returns {Promise<{ flights: Array, pagination: Object }>}
 */
const searchFlights = async (params = {}) => {
  const {
    from,
    to,
    source,
    destination,
    date,
    minPrice,
    maxPrice,
    airline,
    sortBy = "price",
    order = "asc",
    page = 1,
    limit = 20,
    status,
  } = params;

  const filter = {};

  const originCode = (from || source)?.trim()?.toUpperCase();
  if (originCode) {
    filter.origin = originCode;
  }

  const destCode = (to || destination)?.trim()?.toUpperCase();
  if (destCode) {
    filter.destination = destCode;
  }

  if (status) {
    filter.status = status.toUpperCase();
  } else {
    // By default, return SCHEDULED flights for travelers
    filter.status = "SCHEDULED";
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    filter.departureTime = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  if (airline) {
    filter.airline = { $regex: new RegExp(airline, "i") };
  }

  const sortDirection = order === "desc" ? -1 : 1;
  const sortOptions = {};
  sortOptions[sortBy] = sortDirection;

  const skip = (Number(page) - 1) * Number(limit);
  const totalFlights = await Flight.countDocuments(filter);
  const totalPages = Math.ceil(totalFlights / Number(limit)) || 1;

  const flights = await Flight.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  return {
    flights,
    pagination: {
      total: totalFlights,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Get flight by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getFlightById = async (id) => {
  const flight = await Flight.findById(id);
  if (!flight) {
    throw new AppError("Flight not found", 404);
  }
  return flight;
};

/**
 * Create a new flight (Admin)
 * @param {Object} flightData
 * @returns {Promise<Object>}
 */
const createFlight = async (flightData) => {
  const existing = await Flight.findOne({
    flightNumber: flightData.flightNumber.toUpperCase(),
  });
  if (existing) {
    throw new AppError(`Flight number '${flightData.flightNumber}' already exists`, 400);
  }

  if (flightData.availableSeats === undefined) {
    flightData.availableSeats = flightData.totalSeats;
  }

  const flight = await Flight.create(flightData);
  return flight;
};

/**
 * Update an existing flight (Admin)
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const updateFlight = async (id, updateData) => {
  const flight = await Flight.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!flight) {
    throw new AppError("Flight not found", 404);
  }

  return flight;
};

/**
 * Delete flight by ID (Admin)
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteFlight = async (id) => {
  const flight = await Flight.findById(id);
  if (!flight) {
    throw new AppError("Flight not found", 404);
  }
  await flight.deleteOne();
};

module.exports = {
  searchFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
};
